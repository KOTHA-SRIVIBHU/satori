const express = require("express");
const router = express.Router();
const customListController = require("../controllers/customListController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, customListController.createList);
router.get("/my", protect, customListController.getMyLists);
router.post("/add", protect, customListController.addAnimeToList);
router.get("/:id", customListController.getPublicList);

module.exports = router;
