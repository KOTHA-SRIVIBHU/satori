<div align="center">
  <h1>SATORI 🧠✨</h1>
  <p><b>The AI-Native Anime Discovery & Intelligence Engine</b></p>
</div>

---

Satori is a next-generation, deeply analytical platform built to map, analyze, and discover the universe of anime. 

Unlike traditional anime tracking websites that rely purely on basic user ratings, Satori uses Machine Learning, advanced data clustering, and Generative AI (RAG) to understand the underlying "DNA" of every series. It provides spatial visualizations, macro-industry analytics, and highly personalized, explainable AI recommendations that evolve alongside your watch history.

---

## 🚀 Core Modules & Technical Scale

### 1. 🌌 The Anime Galaxy (Spatial UI)
Explore an interactive **4,000 × 4,000 px** 2D star map of the anime universe. 
- **UMAP Dimensionality Reduction:** Satori clusters similar anime together by projecting **384-dimensional feature vectors** down to 2D coordinates.
- **Deep Feature Engineering:** Vectors are built from **382 unique neural tags** plus 2 macro metrics (Score and Popularity).
- **Squared Weighting:** Tags are mathematically weighted using a squared penalty `(rank / 100)²` to heavily emphasize an anime's defining characteristics over minor tropes.

### 2. 🧠 GenAI Insight Engine (RAG Pipeline)
Chat directly with Satori, powered by the lightning-fast **Llama 3.3 (70B) via Groq**.
- **Hyper-Personalized Context:** Satori seamlessly and privately injects your **20 most recent watch entries**, Anime DNA, and Custom Collections into the AI's system prompt before you even say hello.
- **Explainable Recommendations (XAI):** Utilizing `scikit-learn`'s Cosine Similarity against a candidate pool of **2,000 anime**, the engine calculates the exact mathematical overlap of your taste profile to explain *exactly why* a show was recommended.
- **Sliding Memory Window:** The engine retains dynamic context during conversations (sliding 6-message window) for deep, multi-turn interactions without blowing up token limits.
- **K-Means Clustering:** Assigns users to one of **8 distinct K-Means Persona Clusters** based on their long-term viewing habits.

### 3. 📈 Trend Predictor (Most Anticipated)
A real-time analytics module that evaluates upcoming seasonal anime before they air.
- **Custom Heuristic Algorithm:** Engineered a proprietary heuristic logic pipeline in Node.js that scrapes relational datasets via GraphQL. It mathematically scores an upcoming anime's potential for critical success based on the historical trajectory of its prequels and the rating of its source material (Manga/Light Novels).

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
- **ML & AI Brain (server-python):** Python FastAPI service. Handles Feature Engineering (384D vectors), Cosine Similarity, UMAP projections, Random Forest regression, and the RAG pipeline logic.
- **Database:** MongoDB Atlas (Global Cloud Cluster).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend (ML & RAG)** | Python, FastAPI, Scikit-Learn (UMAP, KMeans), Groq (Llama 3.3 70B) |
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
