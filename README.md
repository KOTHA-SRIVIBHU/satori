<div align="center">
  <h1>SATORI 🧠✨</h1>
  <p><b>The AI-Native Anime Discovery & Intelligence Engine</b></p>
</div>

---

Satori is a next-generation, deeply analytical platform built to map, analyze, and discover the universe of anime. 

Unlike traditional anime tracking websites that rely purely on basic user ratings, Satori uses Machine Learning, advanced data clustering, and Generative AI (RAG) to understand the underlying "DNA" of every series. It provides spatial visualizations, macro-industry analytics, and highly personalized, explainable AI recommendations that evolve alongside your watch history.

---

## 🚀 Core Modules & Features

### 1. 🌌 The Anime Galaxy (Spatial UI)
Explore over 1,000+ anime in an interactive 2D star map. Using **UMAP dimensionality reduction**, Satori clusters similar anime together based on 71 unique data dimensions (genres, tags, staff, demographics). 
- **Interactive Neighborhoods:** Click any star to zoom into a specific sub-genre neighborhood and instantly understand its thematic neighbors.
- **Smart Highlighting:** Search for an anime and see its exact coordinates in the universe.

### 2. 🧠 GenAI Insight Engine (RAG Pipeline)
Chat directly with Satori, powered by the lightning-fast **Llama 3 (70B) via Groq**.
- **Hyper-Personalized Context:** Satori seamlessly and privately injects your entire Watch History, Anime DNA, and Custom Collections into the AI's system prompt before you even say hello.
- **Explainable Recommendations (XAI):** Don't just get a title—understand *exactly why* an anime was picked based on your unique watch patterns.
- **Sliding Memory Window:** The engine retains dynamic context during conversations for deep, multi-turn follow-up interactions without blowing up token limits.

### 3. 📈 Trend Predictor (Most Anticipated)
A real-time analytics module that evaluates upcoming seasonal anime before they air.
- **Predictive Scoring:** Satori scrapes hype metadata and uses prequel trajectories and studio DNA to predict the critical success of an upcoming anime.

### 4. 📊 Global Analytics (Macro Intelligence)
A data science dashboard visualizing industry-wide trends over the last two decades.
- **Studio Quality Leaders:** Ranks top production houses by their average critical reception.
- **Yearly Genre Evolution:** High-resolution interactive charts showing exactly how the popularity and quality of specific genres have shifted year-by-year since 2000.

### 5. 🧬 Production Intelligence (Deep Details)
A highly detailed breakdown of any specific anime in the database.
- **Full DNA Markers:** View the precise percentage weights of themes, tags, and genres that make up the show's DNA.
- **Key Staff & Relations:** Understand the brilliant minds behind the production (Directors, Original Creators) and quickly navigate prequel/sequel relations.

---

## 🏗️ Architecture

Satori uses a powerful **Microservice Architecture** to combine the lightning-fast request handling of Node.js with the heavy mathematical and AI processing of Python.

- **Frontend Gateway:** React (Vite) + Tailwind CSS + Framer Motion. 
- **Data & Auth (server-node):** Node.js & Express. Handles JWT Authentication, Database caching, list management, and proxies massive AniList API synchronization.
- **ML & AI Brain (server-python):** Python FastAPI service. Handles Feature Engineering (71D vectors), Cosine Similarity, UMAP projections, and the LangChain/RAG pipeline logic.
- **Database:** MongoDB Atlas (Global Cloud Cluster).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend (ML & RAG)** | Python, FastAPI, Scikit-Learn, UMAP, Groq (Llama 3) |
| **Backend (API)** | Node.js, Express, Mongoose, Axios |
| **Frontend** | React 19, Recharts, Framer Motion, Lucide Icons, React-Markdown |
| **Styling** | Tailwind CSS (Cinematic Dark / Glassmorphism Theme) |

---

## 📥 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB Atlas account
- Groq API Key (for Llama 3)

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
PYTHON_API_URL=http://localhost:8000
```

**server-python/.env:**
```env
MONGODB_URI=your_mongo_uri
DATABASE_NAME=satori
GROQ_API_KEY=your_groq_api_key
```

### 4. Running the Project
Satori requires all three services to be running concurrently:

- **Backend (Node API):** `cd server-node && npm install && npm start`
- **Backend (Python ML/AI):** `cd server-python && source venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
- **Frontend (React UI):** `cd client && npm install && npm run dev`

---

## 📄 License
This project is part of the Satori AI Research initiative. All rights reserved.

---

<div align="center">
  <b>Built with ❤️ for the Anime Community.</b>
</div>
