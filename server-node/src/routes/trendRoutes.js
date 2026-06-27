const express = require("express");
const axios = require("axios");

const router = express.Router();

const ANILIST_API_URL = "https://graphql.anilist.co";

const query = `
query {
  Page(page: 1, perPage: 20) {
    media(status: NOT_YET_RELEASED, type: ANIME, sort: POPULARITY_DESC) {
      id
      title { romaji english }
      coverImage { large medium }
      popularity
      format
      relations {
        edges {
          relationType
          node {
            type
            averageScore
            title { romaji }
          }
        }
      }
    }
  }
}
`;

router.get("/seasonal", async (req, res) => {
  try {
    const response = await axios.post(ANILIST_API_URL, { query });
    const mediaList = response.data.data.Page.media;

    const anticipated = mediaList.map((anime) => {
      let hitReason = null;
      let score = 0;
      
      // 1. Check for PREQUEL
      const prequels = anime.relations.edges.filter(e => e.relationType === "PREQUEL" && e.node.averageScore);
      if (prequels.length > 0) {
        // Find highest rated prequel
        const bestPrequel = prequels.reduce((prev, current) => 
          (prev.node.averageScore > current.node.averageScore) ? prev : current
        );
        
        score = bestPrequel.node.averageScore;
        if (score > 77) {
          hitReason = `High chance of hit because of prequel rating (${score}%)`;
        }
      } 
      // 2. If no prequel, check for SOURCE or ADAPTATION (Manga/Light Novel)
      else {
        const sources = anime.relations.edges.filter(e => 
          (e.relationType === "ADAPTATION" || e.relationType === "SOURCE") && 
          (e.node.type === "MANGA" || e.node.type === "NOVEL") &&
          e.node.averageScore
        );
        
        if (sources.length > 0) {
          const bestSource = sources.reduce((prev, current) => 
            (prev.node.averageScore > current.node.averageScore) ? prev : current
          );
          
          score = bestSource.node.averageScore;
          if (score > 77) {
            hitReason = `High chance of hit because of source rating (${score}%)`;
          }
        }
      }

      return {
        anime_id: anime.id,
        title: anime.title,
        image: anime.coverImage.large || anime.coverImage.medium,
        popularity: anime.popularity,
        format: anime.format,
        xai_reason: hitReason
      };
    });

    res.json({ success: true, data: anticipated });
  } catch (error) {
    console.error("Anticipated Anime Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch anticipated anime" });
  }
});

module.exports = router;
