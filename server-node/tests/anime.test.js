const request = require("supertest");
const app = require("../src/app");
const axios = require("axios");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const AnimeCache = require("../src/models/AnimeCache");

// 1. Mock Axios
jest.mock("axios");

let mongoServer;

describe("Anime Search & Details API", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await AnimeCache.deleteMany({});
  });

  it("should return a list of anime for a valid query", async () => {
    // 2. Setup "Fake" data with deep metadata
    const mockData = {
      data: {
        data: {
          Page: {
            media: [
              {
                id: 1,
                title: { english: "Naruto" },
                description: "Ninja story",
                coverImage: { large: "naruto.jpg" },
                format: "TV",
                status: "FINISHED",
                genres: ["Action"],
                tags: [{ name: "Ninja", rank: 99 }],
                averageScore: 80,
                popularity: 100000
              }
            ]
          }
        }
      }
    };

    axios.post.mockResolvedValue(mockData);

    // 3. Make the request
    const res = await request(app).get("/api/anime/search?q=Naruto");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].title).toBe("Naruto");
    expect(res.body.data[0].image).toBe("naruto.jpg");
  });

  it("should return details for a specific anime", async () => {
    const mockDetail = {
      data: {
        data: {
          Media: {
            id: 2,
            title: { english: "One Piece" },
            coverImage: { large: "one_piece.jpg" },
            format: "TV",
            status: "RELEASING",
            genres: ["Adventure"],
            tags: [{ name: "Pirates", rank: 99 }],
            averageScore: 88,
            popularity: 200000,
            description: "Pirate story"
          }
        }
      }
    };

    axios.post.mockResolvedValue(mockDetail);

    const res = await request(app).get("/api/anime/2");

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(2);
    expect(res.body.source).toBe("api");
  });
});
