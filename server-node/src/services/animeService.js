const axios = require("axios");
const AnimeCache = require("../models/AnimeCache");

const fetchAndCacheAnime = async (id) => {
  try {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
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
    `;
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { id }
    });
    const anime = response.data.data.Media;

    const cached = await AnimeCache.findOneAndUpdate(
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
      { upsert: true, returnDocument: 'after' }
    );
    return cached;
  } catch (error) {
    console.error(`Failed to fetch/cache anime ${id}:`, error.message);
    return null;
  }
};

module.exports = { fetchAndCacheAnime };
