const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  animeList: [
    {
      animeId: { type: Number, required: true },
      status: {
        type: String,
        enum: ["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"],
        default: "PLANNING"
      },
      score: { type: Number, default: 0 }
    }
  ],
  anilistId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
