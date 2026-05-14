const express = require("express");
const router = express.Router();
const animeController = require("../controllers/animeController");

router.get("/search", animeController.searchAnime);
router.get("/:id", animeController.getAnimeDetails);

module.exports = router;
