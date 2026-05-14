const request = require("supertest");
const app = require("../src/app"); // This file doesn't exist yet!

describe("Server Lifecycle", () => {
  it("should return 404 for an unknown route", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.statusCode).toBe(404);
  });
});
