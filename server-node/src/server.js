const app = require("./app");
const mongoose = require("mongoose");
const axios = require("axios");
const AnimeCache = require("./models/AnimeCache");
const { MongoMemoryServer } = require("mongodb-memory-server");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/satori";

async function seedPopularAnime() {
  console.log("🧠 Expanding Satori Knowledge Base (Top 1000 Popular)...");
  try {
    const totalPages = 10; // 10 pages * 100 = 1000 anime
    for (let page = 1; page <= totalPages; page++) {
      const query = `
        query ($page: Int) {
          Page(page: $page, perPage: 100) {
            media(type: ANIME, sort: POPULARITY_DESC) {
              id
              title { english romaji }
              coverImage { large }
              format
              status
              genres
              averageScore
              description
              startDate { year month day }
            }
          }
        }
      `;
      const response = await axios.post("https://graphql.anilist.co", { 
        query, 
        variables: { page } 
      });
      const animeList = response.data.data.Page.media;

      await Promise.all(animeList.map(anime => 
        AnimeCache.findOneAndUpdate(
          { _id: anime.id },
          {
            title: anime.title,
            coverImage: anime.coverImage.large,
            format: anime.format,
            status: anime.status,
            genres: anime.genres,
            averageScore: anime.averageScore,
            description: anime.description,
            startDate: anime.startDate
          },
          { upsert: true }
        )
      ));
      console.log(`✅ Seeded Page ${page}/${totalPages}`);
    }
    console.log("✨ Knowledge Base Fully Expanded!");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  }
}

async function startServer() {
  try {
    // Try to connect to the provided URI
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log("✅ Connected to MongoDB");
    await seedPopularAnime();
  } catch (err) {
    console.warn("⚠️ Local MongoDB connection failed. Starting in-memory database...");
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("✅ Connected to In-Memory MongoDB");
    await seedPopularAnime();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Satori Gateway running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("❌ Critical server startup error:", err);
});
