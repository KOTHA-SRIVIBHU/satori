const mongoose = require("mongoose");
const AnimeCache = require("./src/models/AnimeCache");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const anime = await AnimeCache.findById(22518); // Fate/stay night: UBW? Let's just find one that doesn't have relations
  const all = await AnimeCache.find().limit(10);
  const target = all.find(a => a.title.english && a.title.english.includes("Fate"));
  if (target) {
    console.log("Found:", target.title.english);
    console.log("Relations:", target.relations);
    console.log("Relations length:", target.relations?.length);
    console.log("Is array?", Array.isArray(target.relations));
  }
  process.exit(0);
}
run();
