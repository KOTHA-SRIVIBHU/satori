const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const AnimeCache = require("../src/models/AnimeCache");
const User = require("../src/models/User");

let mongoServer;

describe("MongoDB Models Test", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await AnimeCache.deleteMany({});
    await User.deleteMany({});
  });

  it("should correctly save anime with deep metadata", async () => {
    const mockAnime = {
      _id: 1,
      title: { romaji: "Cowboy Bebop" },
      tags: [{ name: "Space", rank: 95 }, { name: "Bounty Hunters", rank: 90 }],
      averageScore: 86,
      popularity: 150000
    };
    const saved = await new AnimeCache(mockAnime).save();
    expect(saved.tags[0].name).toBe("Space");
    expect(saved.averageScore).toBe(86);
  });

  it("should correctly save a user with an anime list", async () => {
    const user = new User({
      username: "Vibhu",
      email: "vibhu@example.com",
      animeList: [{ animeId: 1, status: "COMPLETED", score: 9 }]
    });
    const saved = await user.save();
    expect(saved.username).toBe("Vibhu");
  });
});
