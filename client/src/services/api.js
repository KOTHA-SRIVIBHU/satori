import axios from 'axios';

const api = axios.create({
  baseURL: 'https://satori-vbj0.onrender.com/api', // Our Node.js Gateway URL
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getRecommendations = async () => {
  const { data } = await api.get('/recommend');
  return data;
};

export const analyzeDNA = async () => {
  const { data } = await api.post('/dna/analyze');
  return data;
};

export const getAnimeDNA = async () => {
  const { data } = await api.get('/anime/dna');
  return data;
};

export const getSeasonalTrends = async () => {
  const { data } = await api.get('/trend/seasonal');
  return data;
};

export const predictHypothetical = async (payload) => {
  const { data } = await api.post('/trend/hypothetical', payload);
  return data;
};

export const getAnalytics = async () => {
  const { data } = await api.get('/anime/analytics');
  return data;
};

// Add a response interceptor to handle expired or invalid sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the server says the user is not found or token failed, clear local storage
      localStorage.removeItem('userInfo');
      // Force a page reload to reset the AuthContext and redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
