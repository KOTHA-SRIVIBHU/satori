const axios = require("axios");
const User = require("../models/User");

exports.syncAniList = async (req, res) => {
  const { username, anilistUsername } = req.body;

  try {
    // 1. GraphQL Query for AniList User List
    const query = `
      query ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME) {
          lists {
            entries {
              mediaId
              status
              score(format: POINT_10)
            }
          }
        }
      }
    `;

    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { userName: anilistUsername },
    });

    // 2. Flatten the nested lists into a single array of anime entries
    const allEntries = response.data.data.MediaListCollection.lists.flatMap(
      (list) => list.entries.map(entry => ({
        animeId: entry.mediaId,
        status: entry.status,
        score: entry.score
      }))
    );

    // 3. Update the local User in MongoDB
    // Use upsert: true to create the user if they don't exist
    const updatedUser = await User.findOneAndUpdate(
      { username: username },
      { 
        animeList: allEntries, 
        anilistId: anilistUsername,
        $setOnInsert: { email: `${username.toLowerCase()}@satori.local` } // Default email for new users
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: "Sync complete",
      count: allEntries.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Sync failed" });
  }
};
