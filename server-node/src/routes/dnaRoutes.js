const express = require("express");
const axios = require("axios");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// POST /api/dna/analyze
router.post("/analyze", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const response = await axios.post(`${PYTHON_SERVICE_URL}/dna/analyze`, {
      user_id: userId,
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("DNA Analysis Error:", error.message);
    res.status(500).json({ success: false, message: "DNA Analysis failed" });
  }
});

module.exports = router;
