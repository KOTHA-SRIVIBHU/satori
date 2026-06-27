const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const animeRoutes = require("./routes/animeRoutes");
const userRoutes = require("./routes/userRoutes");
const customListRoutes = require("./routes/customListRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dnaRoutes = require("./routes/dnaRoutes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Disable caching for API routes
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Routes
app.use("/api/anime", animeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/lists", customListRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/dna", dnaRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;
