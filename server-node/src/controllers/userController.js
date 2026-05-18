const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
const CustomList = require("../models/CustomList");
const AnimeCache = require("../models/AnimeCache");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { fetchAndCacheAnime } = require("../services/animeService");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncAniList = async (req, res) => {
  const { anilistUsername } = req.body;

  try {
    // 1. GraphQL Query for AniList User List
    const query = `
      query ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME) {
          lists {
            entries {
              mediaId
              status
              score(format: POINT_10)
            }
          }
        }
      }
    `;

    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { userName: anilistUsername },
    });

    // 2. Flatten the nested lists into a single array of anime entries
    const allEntries = response.data.data.MediaListCollection.lists.flatMap(
      (list) => list.entries.map(entry => ({
        animeId: entry.mediaId,
        status: entry.status,
        score: entry.score
      }))
    );

    // 3. Update the local User in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        animeList: allEntries, 
        anilistId: anilistUsername,
      },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: "Sync complete",
      count: allEntries.length,
      data: updatedUser.animeList
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Sync failed" });
  }
};

exports.getUserList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 1. Fetch ALL cached anime in ONE database query
    const animeIds = user.animeList.map(item => item.animeId);
    const cachedAnime = await AnimeCache.find({ _id: { $in: animeIds } });
    
    // Create a lookup map for instant access
    const cacheMap = new Map(cachedAnime.map(a => [a._id, a]));

    const missingIds = [];
    const populatedList = [];

    for (const item of user.animeList) {
      const anime = cacheMap.get(item.animeId);
      const itemObj = item.toObject ? item.toObject() : item;
      if (anime) {
        populatedList.push({ ...itemObj, anime });
      } else {
        missingIds.push(item.animeId);
        populatedList.push({ ...itemObj, anime: null }); // placeholder
      }
    }

    // 2. Batch fetch missing IDs (up to 50 at a time to respect limits)
    if (missingIds.length > 0) {
      console.log(`🚀 Batch fetching ${missingIds.length} missing anime from AniList...`);
      try {
        const chunks = [];
        for (let i = 0; i < missingIds.length; i += 50) {
          chunks.push(missingIds.slice(i, i + 50));
        }

        for (const chunk of chunks) {
          const query = `
            query ($ids: [Int]) {
              Page {
                media(id_in: $ids, type: ANIME) {
                  id title { english romaji } coverImage { large }
                  format status genres averageScore description startDate { year month day }
                }
              }
            }
          `;
          const response = await axios.post("https://graphql.anilist.co", { query, variables: { ids: chunk } });
          const fetchedMedia = response.data.data.Page.media;

          const cacheUpdates = fetchedMedia.map(async (anime) => {
            const newCache = await AnimeCache.findOneAndUpdate(
              { _id: anime.id },
              {
                title: anime.title, coverImage: anime.coverImage.large, format: anime.format,
                status: anime.status, genres: anime.genres, averageScore: anime.averageScore,
                description: anime.description, startDate: anime.startDate
              },
              { upsert: true, returnDocument: 'after' }
            );

            // Update placeholder in our response list
            const target = populatedList.find(p => p.animeId === anime.id);
            if (target) target.anime = newCache;
          });
          
          await Promise.all(cacheUpdates);
        }
      } catch (err) {
        console.warn("Batch fetch for missing anime failed:", err.message);
      }
    }

    // Provide default for any still missing (due to errors)
    const finalList = populatedList.map(item => ({
      ...item,
      anime: item.anime || { title: { romaji: "Unknown Anime" }, coverImage: "" }
    }));

    res.json({ success: true, data: finalList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAnimeStatus = async (req, res) => {
  const { animeId, status, score } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const animeIndex = user.animeList.findIndex(item => item.animeId === Number(animeId));

    if (animeIndex > -1) {
      // Update existing entry
      if (status) user.animeList[animeIndex].status = status;
      if (score !== undefined) user.animeList[animeIndex].score = score;
    } else {
      // Add new entry
      user.animeList.push({
        animeId: Number(animeId),
        status: status || "PLANNING",
        score: score || 0
      });
      
      // Trigger cache fetch if missing
      const cache = await AnimeCache.findById(animeId);
      if (!cache) {
        await fetchAndCacheAnime(animeId);
      }
    }

    await user.save();
    res.json({ success: true, message: "List updated successfully", data: user.animeList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  const { username } = req.params;
  console.log(`🔍 Public profile request for: ${username}`);
  try {
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).select("-password");
    if (!user) {
      console.warn(`❌ User not found: ${username}`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`✅ Found user: ${user.username}. Anime count: ${user.animeList.length}`);

    // Fetch custom lists that are public
    const publicLists = await CustomList.find({ owner: user._id, isPublic: true });
    console.log(`📁 Found ${publicLists.length} public custom lists.`);

    // Populate anime details for the main AniList sync
    const animeIds = user.animeList.map(item => item.animeId);
    const cachedAnime = await AnimeCache.find({ _id: { $in: animeIds } });
    const cacheMap = new Map(cachedAnime.map(a => [a._id, a]));

    const missingIds = [];
    const populatedMainList = [];

    for (const item of user.animeList) {
      const anime = cacheMap.get(item.animeId);
      const itemObj = item.toObject ? item.toObject() : item;
      if (anime) {
        populatedMainList.push({ ...itemObj, anime });
      } else {
        missingIds.push(item.animeId);
        populatedMainList.push({ ...itemObj, anime: null });
      }
    }

    // Batch fetch missing IDs for public profile too!
    if (missingIds.length > 0) {
      console.log(`🚀 Batch fetching ${missingIds.length} missing anime for public profile...`);
      try {
        const chunks = [];
        for (let i = 0; i < missingIds.length; i += 50) chunks.push(missingIds.slice(i, i + 50));
        for (const chunk of chunks) {
          const query = `query ($ids: [Int]) { Page { media(id_in: $ids, type: ANIME) { id title { english romaji } coverImage { large } format status genres averageScore description startDate { year month day } } } }`;
          const response = await axios.post("https://graphql.anilist.co", { query, variables: { ids: chunk } });
          const fetchedMedia = response.data.data.Page.media;
          for (const anime of fetchedMedia) {
            const newCache = await AnimeCache.findOneAndUpdate(
              { _id: anime.id },
              { title: anime.title, coverImage: anime.coverImage.large, format: anime.format, status: anime.status, genres: anime.genres, averageScore: anime.averageScore, description: anime.description, startDate: anime.startDate },
              { upsert: true, returnDocument: 'after' }
            );
            const target = populatedMainList.find(p => p.animeId === anime.id);
            if (target) target.anime = newCache;
          }
        }
      } catch (err) { console.warn("Public batch fetch failed:", err.message); }
    }

    const finalMainList = populatedMainList.map(item => ({
      ...item,
      anime: item.anime || { title: { romaji: "Unknown" }, coverImage: "" }
    }));

    console.log(`✨ Sending profile for ${user.username}. Main list entries: ${finalMainList.length}`);

    res.json({
      success: true,
      data: {
        username: user.username,
        mainList: finalMainList,
        customLists: publicLists
      }
    });
  } catch (error) {
    console.error("Public profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
