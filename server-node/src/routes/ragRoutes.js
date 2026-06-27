const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const AnimeCache = require('../models/AnimeCache');

const CustomList = require('../models/CustomList');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Messages array is required' });
  }

  try {
    // 1. Fetch first user's watch history from DB (Simplification for now)
    const user = await User.findOne({});
    let userList = [];
    if (user && user.animeList) {
      userList = user.animeList;
    }

    // 2. We need the anime titles, so let's join with AnimeCache
    const watchHistory = [];
    for (const item of userList) {
      const anime = await AnimeCache.findOne({ _id: item.animeId });
      if (anime) {
        watchHistory.push({
          title: anime.title?.english || anime.title?.romaji || 'Unknown',
          score: item.score,
          status: item.status
        });
      }
    }

    // 2. We should ideally fetch the user's computed DNA markers.
    // For now, we will ask the python server to compute the DNA on the fly or we could just fetch it if we had it cached.
    // The python /dna/analyze endpoint returns the DNA cluster markers.
    // Let's call it first.
    let dnaMarkers = {};
    try {
      const dnaRes = await axios.post(`${PYTHON_API_URL}/dna/analyze`, {
        user_id: "default",
        watch_history: userList
      });
      if (dnaRes.data && dnaRes.data.success && dnaRes.data.user_cluster) {
        // user_cluster.features contains the top tags
        dnaMarkers = dnaRes.data.user_cluster.features || {};
      }
    } catch (dnaErr) {
      console.warn("Failed to fetch DNA for RAG context:", dnaErr.message);
    }

    // 3. Fetch custom lists
    const customListsRaw = await CustomList.find({});
    const customLists = [];
    for (const list of customListsRaw) {
      const listAnime = [];
      for (const aid of list.animeIds) {
        const anime = await AnimeCache.findOne({ _id: aid });
        if (anime) {
          listAnime.push(anime.title?.english || anime.title?.romaji || 'Unknown');
        }
      }
      customLists.push({
        name: list.name,
        anime: listAnime
      });
    }

    // 4. Send all context + history to the Python RAG Engine
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
