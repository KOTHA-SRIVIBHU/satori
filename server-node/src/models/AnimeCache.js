const mongoose = require("mongoose");

const animeSchema = new mongoose.Schema({
  _id: { type: Number, required: true }, // AniList ID
  title: {
    romaji: String,
    english: String,
  },
  coverImage: String,
  format: String,   // TV, MOVIE, etc.
  status: String,   // FINISHED, RELEASING
  genres: [String],
  tags: [
    {
      name: String,
      rank: Number   // Weight (0-100) - Critical for ML!
    }
  ],
  averageScore: Number,
  popularity: Number,
  description: String,
  source: String,
  episodes: Number,
  duration: Number,
  startDate: {
    year: Number,
    month: Number,
    day: Number
  },
  studios: [String],
  staff: [
    {
      role: String,
      name: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // 24 Hours
  },
});

module.exports = mongoose.model("AnimeCache", animeSchema);
