const express = require('express');
const router = express.Router();
const mlService = require('../services/mlService');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    // req.user.id is populated by authMiddleware
    const recommendations = await mlService.getRecommendations(req.user.id);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
