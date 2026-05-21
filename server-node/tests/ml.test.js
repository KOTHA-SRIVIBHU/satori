const request = require('supertest');
const app = require('../src/app');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

jest.mock('axios');
jest.mock('../src/models/User');

describe('ML Integration API', () => {
  let token;
  const mockUserId = '60d5ecb8b392d70015f8e000';

  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
    token = jwt.sign({ id: mockUserId }, process.env.JWT_SECRET);
  });

  describe('GET /api/recommend', () => {
    it('should return recommendations when authenticated', async () => {
      // Mock User.findById for authMiddleware
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: mockUserId, username: 'testuser' })
      });

      // Mocking axios response from Python service
      const mockRecommendations = [
        { anime_id: 1, title: 'Test Anime', similarity_score: 0.9, xai_reason: 'Because test' }
      ];
      axios.post.mockResolvedValue({ data: mockRecommendations });

      const response = await request(app)
        .get('/api/recommend')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRecommendations);
      expect(axios.post).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/recommend');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/anime/dna', () => {
    it('should return Anime DNA data', async () => {
      const mockDNA = [{ id: 1, title: 'Test', x: 10, y: 20, genres: ['Action'] }];
      axios.get.mockResolvedValue({ data: mockDNA });

      const response = await request(app).get('/api/anime/dna');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDNA);
      expect(axios.get).toHaveBeenCalled();
    });
  });
});
