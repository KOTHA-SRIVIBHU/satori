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
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { search: q },
    });
    
    const apiResults = response.data.data.Page.media.map(a => ({
      id: a.id,
      title: a.title.english || a.title.romaji,
      description: a.description,
      image: a.coverImage.large,
      year: a.startDate?.year,
      status: a.status,
      averageScore: a.averageScore,
      source: "api"
    }));

    // 3. Merge and Deduplicate Results
    // We prefer API results but fill in with fuzzy matches from cache
    const combined = [...apiResults];
    fuzzyResults.forEach(fuzzy => {
      if (!combined.find(item => item.id === fuzzy.id)) {
        combined.push(fuzzy);
      }
    });

    // 4. Cache the new API results (asynchronously)
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
        { upsert: true }
      );
    })).catch(err => console.error("Cache update failed", err));

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
    if (anime && anime.studios && anime.studios.length > 0) {
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
        }))
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({ success: true, data: newCache, source: "api" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch details" });
  }
};
