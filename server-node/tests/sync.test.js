const request = require("supertest");
const app = require("../src/app");
const axios = require("axios");
const User = require("../src/models/User");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

jest.mock("axios");

let mongoServer;

describe("AniList Profile Sync API", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("should sync user data from AniList and update MongoDB", async () => {
    // 1. Create a local user first
    const user = await new User({ username: "Vibhu", email: "v@e.com" }).save();

    // 2. Mock the AniList GraphQL response
    const mockAniListData = {
      data: {
        data: {
          MediaListCollection: {
            lists: [
              {
                entries: [
                  { mediaId: 101, status: "COMPLETED", score: 9 }
                ]
              }
            ]
          }
        }
      }
    };
    axios.post.mockResolvedValue(mockAniListData);

    // 3. Call the sync endpoint
    const res = await request(app)
      .post("/api/user/sync-anilist")
      .send({ username: "Vibhu", anilistUsername: "AniVibhu" });

    expect(res.statusCode).toBe(200);

    // 4. Verify DB was updated
    const updatedUser = await User.findOne({ username: "Vibhu" });
    expect(updatedUser.animeList[0].animeId).toBe(101);
    expect(updatedUser.animeList[0].score).toBe(9);
  });
});
