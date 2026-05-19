# 🌌 SATORI: Next-Gen Anime Intelligence Engine

[![Live Demo](https://img.shields.io/badge/demo-live-blueviolet?style=for-the-badge)](https://satori-five-sage.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-green?style=for-the-badge)](https://satori-vbj0.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-white?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

**Satori** is a cinematic, AI-native anime discovery and management platform built for the modern enthusiast. It transcends traditional listing sites by offering a high-performance, persistent intelligence layer that maps your viewing journey across the global anime ecosystem.

---

## 🚀 Key Features

### 🧠 Intelligence & Caching
- **Hybrid Knowledge Base:** Pre-seeded with the Top 1,000 global series for instantaneous discovery and reduced API latency.
- **JIT (Just-In-Time) Sync:** Proprietary batch-fetching logic that retrieves niche intelligence from AniList on-the-fly, ensuring zero "Unknown Entries."
- **Persistent Memory:** Fully persistent production environment powered by MongoDB Atlas.

### 🔐 Security & Personalization
- **JWT Architecture:** Secure, token-based authentication with industry-standard `bcrypt` password hashing.
- **Universal Status Engine:** Seamlessly manage "Watching," "Planning," and "Completed" states directly from any entry point.
- **Personal Rating System:** A custom 1-10 scoring layer that dynamically enriches your search results and public profiles.

### 🌐 Social Intelligence
- **Public Profiles:** Unique, shareable verified profile links (e.g., `/profile/Vibhu`) to showcase your entire collection.
- **Custom Set Lists:** Curate, name, and share targeted collections of anime with distinct privacy controls.
- **Smart Toggle:** Intuitive collection management with real-time indicators for existing entries.

### 🎨 Cinematic Experience
- **Minimalist Dark UI:** A refined, high-contrast aesthetic designed to put the focus on the artwork and metadata.
- **URL-Based State:** Deep-linking and state persistence ensure that browser navigation (Back/Forward) always preserves your specific filters and search queries.

---

## 🛠 Tech Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Axios |
| **Backend** | Node.js, Express, JSON Web Tokens (JWT), Bcrypt.js, Morgan |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Search** | Fuse.js (Local Fuzzy Search), GraphQL (AniList API Integration) |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📦 Deployment & Configuration

### Backend Environment Variables
To run the intelligence gateway, the following `.env` parameters are required:
```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_ultra_secure_secret
PORT=5000
```

### Frontend Configuration
Update `client/src/services/api.js` with your production endpoint:
```javascript
const api = axios.create({
  baseURL: 'https://your-api-url.onrender.com/api',
});
```

---

## 🛰 API Endpoints

### User Intelligence
- `POST /api/user/register` - Initialize new intelligence profile.
- `POST /api/user/login` - Authenticate and retrieve session token.
- `POST /api/user/sync-anilist` - Synchronize global AniList data to local persistent storage.
- `POST /api/user/status-update` - Modify anime status or personal rating.

### Collection Management
- `GET /api/lists/my` - Fetch owner's custom collections.
- `POST /api/lists/add` - Append entry to a collection.
- `DELETE /api/lists/:id` - Purge an entire collection.

---

## 🤝 Contributing
Contributions to the Satori Intelligence Engine are welcome. Please ensure that all UI modifications adhere to the established "Minimalist-Dark" aesthetic and that new backend routes are protected by the `protect` middleware.

---

## 📄 License
This project is licensed under the ISC License.

---
*Built with ❤️ for the global anime community.*
