const axios = require('axios');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

class MLService {
  async getRecommendations(userId, limit = 10) {
    try {
      const response = await axios.post(`${PYTHON_SERVICE_URL}/recommend/`, {
        user_id: userId,
        limit: limit
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations from ML service:', error.message);
      // Graceful degradation: return empty or fallback handled in controller
      return [];
    }
  }

  async getAnimeDNA() {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/anime-dna/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Anime DNA from ML service:', error.message);
      return [];
    }
  }
}

module.exports = new MLService();
