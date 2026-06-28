const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const AnimeCache = require('../models/AnimeCache');
const CustomList = require('../models/CustomList');
const { protect } = require('../middleware/authMiddleware');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

router.post('/chat', protect, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Messages array is required' });
  }

  try {
    // 1. Fetch authenticated user's watch history from DB
    const user = await User.findById(req.user._id);
    let userList = [];
    if (user && user.animeList) {
      userList = user.animeList;
    }

    // 2. Batch fetch anime titles (single $in query instead of N+1 loop)
    const animeIds = userList.map(item => item.animeId);
    const cachedAnime = await AnimeCache.find({ _id: { $in: animeIds } });
    const cacheMap = new Map(cachedAnime.map(a => [a._id, a]));

    const watchHistory = [];
    for (const item of userList) {
      const anime = cacheMap.get(item.animeId);
      if (anime) {
        watchHistory.push({
          title: anime.title?.english || anime.title?.romaji || 'Unknown',
          score: item.score,
          status: item.status,
          genres: anime.genres || [],
        });
      }
    }

    // 3. Fetch DNA markers from Python service
    let dnaMarkers = {};
    try {
      const dnaRes = await axios.post(`${PYTHON_API_URL}/dna/analyze`, {
        user_id: req.user._id.toString(),
      });
      if (dnaRes.data) {
        // Extract top_tags as DNA markers for RAG context
        const topTags = dnaRes.data.top_tags || [];
        for (const tag of topTags) {
          dnaMarkers[tag.tag] = tag.strength;
        }
        // Also add persona info
        if (dnaRes.data.persona) {
          dnaMarkers['_persona'] = dnaRes.data.persona;
        }
        if (dnaRes.data.top_genres) {
          dnaMarkers['_top_genres'] = dnaRes.data.top_genres.map(g => g.genre).join(', ');
        }
      }
    } catch (dnaErr) {
      console.warn("Failed to fetch DNA for RAG context:", dnaErr.message);
    }

    // 4. Fetch custom lists (batch fetch anime titles)
    const customListsRaw = await CustomList.find({ owner: req.user._id });
    const customLists = [];

    // Collect all anime IDs from all lists
    const listAnimeIds = customListsRaw.flatMap(list => list.animeIds || []);
    const listCachedAnime = await AnimeCache.find({ _id: { $in: listAnimeIds } });
    const listCacheMap = new Map(listCachedAnime.map(a => [a._id, a]));

    for (const list of customListsRaw) {
      const listAnime = (list.animeIds || [])
        .map(aid => listCacheMap.get(aid))
        .filter(Boolean)
        .map(anime => anime.title?.english || anime.title?.romaji || 'Unknown');

      customLists.push({
        name: list.name,
        anime: listAnime
      });
    }

    // 5. Send all context + history to the Python RAG Engine
    const ragRes = await axios.post(`${PYTHON_API_URL}/rag/chat`, {
      messages,
      watch_history: watchHistory,
      dna_markers: dnaMarkers,
      custom_lists: customLists
    });

    res.json({ success: true, answer: ragRes.data.answer });
  } catch (error) {
    console.error('RAG Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to generate insight.' });
  }
});

module.exports = router;
