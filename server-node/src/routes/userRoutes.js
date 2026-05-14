const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/sync-anilist", userController.syncAniList);

module.exports = router;
