const express = require("express");
const router = express.Router();
const animeController = require("../controllers/animeController");
const mlService = require("../services/mlService");

router.get("/search", animeController.searchAnime);
router.get("/analytics", animeController.getAnalytics);
router.get("/dna", async (req, res) => {
  try {
    const dna = await mlService.getAnimeDNA();
    res.json({ success: true, data: dna });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/:id", animeController.getAnimeDetails);

module.exports = router;
