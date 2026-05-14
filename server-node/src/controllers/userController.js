const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncAniList = async (req, res) => {
  const { anilistUsername } = req.body;

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
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        animeList: allEntries, 
        anilistId: anilistUsername,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Sync complete",
      count: allEntries.length,
      data: updatedUser.animeList
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Sync failed" });
  }
};

exports.getUserList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Map through the user's animeList and fetch details from AnimeCache
    const populatedList = await Promise.all(
      user.animeList.map(async (item) => {
        const anime = await mongoose.model("AnimeCache").findById(item.animeId);
        return {
          ...item._doc,
          anime: anime || { title: { romaji: "Unknown Anime" }, coverImage: "" }
        };
      })
    );

    res.json({ success: true, data: populatedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
