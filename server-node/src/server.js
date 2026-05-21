const app = require("./app");
const mongoose = require("mongoose");
const axios = require("axios");
const AnimeCache = require("./models/AnimeCache");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ CRITICAL ERROR: MONGODB_URI is missing in .env file.");
  console.error("Please provide a valid MongoDB connection string (e.g., MongoDB Atlas) to run Satori in production.");
  process.exit(1);
}

async function seedPopularAnime() {
  const count = await AnimeCache.countDocuments();
  if (count >= 1000) {
    console.log(`✅ Knowledge Base already has ${count} entries. Skipping seeding.`);
    return;
  }

  console.log(`🧠 Expanding Satori Knowledge Base (Currently ${count}/1000)...`);
  try {
    const totalPages = 20; // 20 pages * 50 = 1000 anime (let's use 50 per page for safety)
    for (let page = 1; page <= totalPages; page++) {
      const query = `
        query ($page: Int) {
          Page(page: $page, perPage: 50) {
            media(type: ANIME, sort: POPULARITY_DESC) {
              id title { english romaji } coverImage { large }
              format status genres averageScore description startDate { year month day }
              tags { name rank }
              popularity
              studios(isMain: true) {
                nodes { name }
              }
            }
          }
        }
      `;
      const response = await axios.post("https://graphql.anilist.co", { query, variables: { page } });
      const animeList = response.data.data.Page.media;

      await Promise.all(animeList.map(anime => 
        AnimeCache.findOneAndUpdate(
          { _id: anime.id },
          {
            title: anime.title, coverImage: anime.coverImage.large, format: anime.format,
            status: anime.status, genres: anime.genres, averageScore: anime.averageScore,
            description: anime.description, startDate: anime.startDate,
            tags: anime.tags, popularity: anime.popularity,
            studios: anime.studios?.nodes?.map(n => n.name) || []
          },
          { upsert: true, returnDocument: 'after' }
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
    await mongoose.connect(MONGODB_URI, { dbName: 'satori' });
    console.log("✅ Connected to Production MongoDB (Database: satori)");
    await seedPopularAnime();
    
    app.listen(PORT, () => {
      console.log(`🚀 Satori Gateway running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed. Cannot start server in production mode.");
    console.error(err.message);
    process.exit(1);
  }
}

startServer();
