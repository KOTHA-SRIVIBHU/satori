import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/user/login', { email, password });
      login(data.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="mb-6 text-3xl font-bold text-center text-white">Login to Satori</h2>
        {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-900/50 rounded">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-bold text-white transition bg-purple-600 rounded hover:bg-purple-700"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-gray-400">
          Don't have an account? <Link to="/register" className="text-purple-500 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
