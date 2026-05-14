import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Our Node.js Gateway URL
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

export default api;
