const CustomList = require("../models/CustomList");
const { fetchAndCacheAnime } = require("../services/animeService");
const mongoose = require("mongoose");

exports.createList = async (req, res) => {
  const { name, description, isPublic } = req.body;
  try {
    const list = await CustomList.create({
      name,
      description,
      isPublic,
      owner: req.user.id
    });
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addAnimeToList = async (req, res) => {
  const { listId, animeId } = req.body;
  try {
    const list = await CustomList.findOne({ _id: listId, owner: req.user.id });
    if (!list) return res.status(404).json({ success: false, message: "List not found" });

    if (!list.animeIds.includes(animeId)) {
      list.animeIds.push(animeId);
      await list.save();
      
      // Ensure it's cached
      const cache = await mongoose.model("AnimeCache").findById(animeId);
      if (!cache) await fetchAndCacheAnime(animeId);
    }

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyLists = async (req, res) => {
  try {
    const lists = await CustomList.find({ owner: req.user.id });
    res.json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicList = async (req, res) => {
  try {
    const list = await CustomList.findById(req.params.id).populate("owner", "username");
    if (!list || (!list.isPublic && (!req.user || req.user.id !== list.owner.toString()))) {
      return res.status(404).json({ success: false, message: "List not found or private" });
    }

    const populatedAnime = await Promise.all(
      list.animeIds.map(async (id) => {
        let anime = await mongoose.model("AnimeCache").findById(id);
        if (!anime) anime = await fetchAndCacheAnime(id);
        return anime || { _id: id, title: { romaji: "Unknown" } };
      })
    );

    res.json({ success: true, data: { ...list._doc, anime: populatedAnime } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
