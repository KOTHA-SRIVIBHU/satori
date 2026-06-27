const axios = require("axios");
const AnimeCache = require("../models/AnimeCache");
const Fuse = require("fuse.js");

exports.searchAnime = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: "Query is required" });

  try {
    // 1. Fuzzy Search in Local Cache (To handle misspellings)
    // We fetch a sample of cached anime to find the closest matches
    const localCache = await AnimeCache.find().limit(1000);
    const fuse = new Fuse(localCache, {
      keys: ["title.english", "title.romaji"],
      threshold: 0.5, // Slightly more forgiving
      includeScore: true,
      ignoreLocation: true, // Search anywhere in the string
      minMatchCharLength: 3
    });
    
    const fuzzyResults = fuse.search(q).map(result => ({
      id: result.item._id,
      title: result.item.title.english || result.item.title.romaji,
      description: result.item.description,
      image: result.item.coverImage,
      year: result.item.startDate?.year,
      status: result.item.status,
      averageScore: result.item.averageScore,
      source: "cache-fuzzy"
    }));

    // 2. Standard AniList API Search
    const query = `
      query ($search: String) {
        Page(perPage: 10) {
          media(search: $search, type: ANIME) {
            id
            title { english romaji }
            coverImage { large }
            format
            status
            genres
            startDate { year }
            averageScore
            description
          }
        }
      }
    `;

    let apiResults = [];
    try {
      const response = await axios.post("https://graphql.anilist.co", {
        query,
        variables: { search: q },
      });
      
      apiResults = response.data.data.Page.media.map(a => ({
        id: a.id,
        title: a.title.english || a.title.romaji,
        description: a.description,
        image: a.coverImage.large,
        year: a.startDate?.year,
        status: a.status,
        genres: a.genres,
        averageScore: a.averageScore,
        source: "api"
      }));

      // Cache the new API results (asynchronously)
      const animeList = response.data.data.Page.media;
      Promise.all(animeList.map(async (anime) => {
        await AnimeCache.findOneAndUpdate(
          { _id: anime.id },
          {
            title: anime.title,
            coverImage: anime.coverImage.large,
            format: anime.format,
            status: anime.status,
            genres: anime.genres,
            averageScore: anime.averageScore,
            description: anime.description,
            startDate: anime.startDate
          },
          { upsert: true, returnDocument: 'after' }
        );
      })).catch(err => console.error("Cache update failed", err));

    } catch (apiError) {
      console.warn("AniList API search failed or rate-limited. Serving from cache only.", apiError.message);
    }

    // 3. Merge and Deduplicate Results
    // We prefer API results but fill in with fuzzy matches from cache
    const combined = [...apiResults];
    fuzzyResults.forEach(fuzzy => {
      if (!combined.find(item => item.id === fuzzy.id)) {
        combined.push(fuzzy);
      }
    });

    res.status(200).json({ success: true, data: combined.slice(0, 10) });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

exports.getAnimeDetails = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Check local cache first
    let anime = await AnimeCache.findById(id);

    // If anime exists but is missing "Deep Metadata" (from a previous search cache), 
    // we continue to fetch it from the API to fill the gaps.
    if (anime && anime.studios && anime.studios.length > 0 && anime.hasRelations) {
      return res.status(200).json({ success: true, data: anime, source: "cache" });
    }

    // 2. If not in cache, fetch from AniList
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { english romaji }
          coverImage { large }
          format
          status
          genres
          tags { name rank }
          averageScore
          popularity
          description
          source
          episodes
          duration
          startDate { year month day }
          studios(isMain: true) {
            nodes { name }
          }
          staff {
            edges {
              role
              node {
                name { full }
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                type
                format
                status
                title { english romaji }
              }
            }
          }
        }
      }
    `;

    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { id: Number(id) },
    });

    const data = response.data.data.Media;

    // 3. Save to cache
    const newCache = await AnimeCache.findOneAndUpdate(
      { _id: data.id },
      {
        title: data.title,
        coverImage: data.coverImage.large,
        format: data.format,
        status: data.status,
        genres: data.genres,
        tags: data.tags,
        averageScore: data.averageScore,
        popularity: data.popularity,
        description: data.description,
        source: data.source,
        episodes: data.episodes,
        duration: data.duration,
        startDate: data.startDate,
        studios: data.studios.nodes.map(n => n.name),
        staff: data.staff.edges.map(edge => ({
          role: edge.role,
          name: edge.node.name.full
        })),
        relations: data.relations.edges.map(edge => ({
          relationType: edge.relationType,
          node: {
            id: edge.node.id,
            type: edge.node.type,
            format: edge.node.format,
            status: edge.node.status,
            title: {
              english: edge.node.title?.english,
              romaji: edge.node.title?.romaji
            }
          }
        })),
        hasRelations: true
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({ success: true, data: newCache, source: "api" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch details" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Genre Popularity (Count per genre) - Normalized Score
    const genrePopularity = await AnimeCache.aggregate([
      { $unwind: "$genres" },
      { 
        $group: { 
          _id: "$genres", 
          count: { $sum: 1 },
          avgScore: { $avg: "$averageScore" }
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 2. Studio Quality Leaders (Min 10 works, Top 15) - Normalized 0-10
    const studioQuality = await AnimeCache.aggregate([
      { $unwind: "$studios" },
      { 
        $group: { 
          _id: "$studios", 
          avgScore: { $avg: "$averageScore" },
          count: { $sum: 1 }
        } 
      },
      { $match: { count: { $gte: 10 } } }, 
      { $sort: { avgScore: -1 } },
      { $limit: 15 }
    ]);

    // 3. Genre Quality Spectrum - Normalized 0-10
    const genreQuality = await AnimeCache.aggregate([
      { $unwind: "$genres" },
      { 
        $group: { 
          _id: "$genres", 
          avgScore: { $avg: "$averageScore" }
        } 
      },
      { $sort: { avgScore: -1 } },
      { $limit: 12 }
    ]);

    // 4. Historical Genre Trends (Year-by-Year per Genre)
    const historicalGenreTrends = await AnimeCache.aggregate([
      { $unwind: "$genres" },
      { 
        $match: { 
          "startDate.year": { $exists: true, $ne: null, $gte: 2000 }, // Filter for modern era for density
          "averageScore": { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: { 
            year: "$startDate.year", 
            genre: "$genres" 
          },
          avgScore: { $avg: "$averageScore" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "avgScore": -1 } }
    ]);

    // Reformat historical trends for easier frontend charting
    const yearMap = {};
    historicalGenreTrends.forEach(item => {
      const year = item._id.year;
      const genre = item._id.genre;
      if (!yearMap[year]) yearMap[year] = { year };
      yearMap[year][genre] = Math.round(item.avgScore / 10 * 10) / 10;
      yearMap[year][`${genre}_count`] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        genrePopularity: genrePopularity.map(g => ({
          genre: g._id,
          count: g.count,
          avgScore: Math.round(g.avgScore / 10 * 10) / 10
        })),
        studioQuality: studioQuality.map(s => ({
          studio: s._id,
          avgScore: Math.round(s.avgScore / 10 * 10) / 10,
          count: s.count
        })),
        genreQuality: genreQuality.map(g => ({
          genre: g._id,
          avgScore: Math.round(g.avgScore / 10 * 10) / 10
        })),
        historicalTrends: Object.values(yearMap)
      }
    });
  } catch (error) {
    console.error("Analytics aggregation failed:", error);
    res.status(500).json({ success: false, message: "Aggregation failed" });
  }
};
