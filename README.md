# SATORI 🧠✨
**The AI-Native Anime Discovery & Intelligence Engine**

Satori is a next-generation platform built to map, analyze, and discover the universe of anime. Unlike traditional trackers, Satori uses Machine Learning to understand the "DNA" of every series, providing spatial visualizations and explainable AI recommendations.

---

## 🚀 Key Features

### 1. **The Anime Galaxy (Spatial UI)**
Explore 1,000+ anime in a 2D star map. Using **UMAP dimensionality reduction**, Satori clusters similar anime together based on 71 unique data dimensions. 
- **Interactive Clusters:** Click any star to focus on a genre neighborhood.
- **Smart Search:** Highlight matching anime across the entire universe in real-time.

### 2. **Satori's Intelligence (Explainable AI)**
Get personalized recommendations that evolve with you.
- **Dynamic Taste Vectors:** The engine analyzes your **10 most recently watched** anime to shift recommendations instantly.
- **XAI Badges:** Don't just get a score—understand *why* an anime was picked (e.g., *"Because you enjoy Action and Fantasy series"*).

### 3. **Global Analytics (Macro Intelligence)**
A data science dashboard visualizing industry-wide trends.
- **Studio Quality Leaders:** Ranks production houses by average critical reception.
- **Yearly Genre Evolution:** High-resolution trends showing how genre quality has shifted year-by-year since 2000.

---

## 🏗️ Architecture

Satori uses a **Microservice Architecture** to combine the speed of Node.js with the mathematical power of Python.

- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion + Recharts.
- **Gateway (server-node):** Node.js & Express. Handles Authentication (JWT), Database proxying, and AniList API synchronization.
- **ML Brain (server-python):** FastAPI service. Handles Feature Engineering (71D vectors), Cosine Similarity, and UMAP projections.
- **Database:** MongoDB Atlas (Global Cloud Cluster).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend (ML)** | Python, FastAPI, Scikit-Learn, UMAP, Motor |
| **Backend (API)** | Node.js, Express, Mongoose, Axios |
| **Frontend** | React 19, Recharts, Framer Motion, Lucide Icons |
| **Styling** | Tailwind CSS (Cinematic Dark Theme) |
| **DevOps** | Render (Deployment), GitHub, Virtual Environments |

---

## 📥 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB Atlas account

### 2. Clone and Install
```bash
git clone https://github.com/KOTHA-SRIVIBHU/satori.git
cd satori
```

### 3. Environment Configuration
Create `.env` files in `server-node/` and `server-python/`:

**server-node/.env:**
```env
PORT=5000
MONGODB_URI=your_mongo_uri
JWT_SECRET=your_secret
PYTHON_SERVICE_URL=http://localhost:8000
```

**server-python/.env:**
```env
MONGODB_URI=your_mongo_uri
DATABASE_NAME=satori
```

### 4. Running the Project
- **Backend (Node):** `cd server-node && npm install && npm start`
- **Backend (Python):** `cd server-python && source venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
- **Frontend:** `cd client && npm install && npm run dev`

---

## 📄 License
This project is part of the Satori AI Research initiative. All rights reserved.

---

**Built with ❤️ for the Anime Community.**
