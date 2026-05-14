const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/sync-anilist", protect, userController.syncAniList);
router.get("/list", protect, userController.getUserList);
router.post("/status-update", protect, userController.updateAnimeStatus);

module.exports = router;
