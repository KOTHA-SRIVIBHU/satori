const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const animeRoutes = require("./routes/animeRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/anime", animeRoutes); // This mounts your search to /api/anime/search
app.use("/api/user", userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;
