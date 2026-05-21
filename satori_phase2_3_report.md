# Satori Project Report: Phases 2 & 3
**Focus:** The Insight Engine (Python/ML) & Intelligence UI (Frontend)

## Executive Summary
This report details the architectural implementation and feature development for Phases 2 and 3 of the Satori platform. The objective was to build a robust, AI-native backend ("The Brain") capable of generating personalized recommendations and spatial visualizations, and to integrate these features seamlessly into a cinematic, highly interactive React frontend. The system now successfully ingests raw metadata, transforms it into mathematical vectors, and presents it as actionable, explainable intelligence.

---

## Phase 2: The Insight Engine (Python & ML)
**Objective:** Establish a Python-based microservice to handle machine learning tasks, vectorization, and recommendation logic, operating alongside the Node.js API gateway.

### 1. Architectural Scaffolding & Environment
*   **Implementation:** Initialized a Python virtual environment with FastAPI for high-performance async routing.
*   **Dependencies:** Integrated `motor` for async MongoDB operations, `pydantic-settings` for environment configuration, `pytest` for TDD, and `scikit-learn` / `umap-learn` / `numpy` for data science operations.
*   **TDD Approach:** Established a rigorous Red-Green testing cycle, ensuring endpoint health and database connectivity before feature development.

### 2. Async Database Connectivity
*   **Implementation:** Developed a robust MongoDB manager utilizing the Motor driver.
*   **Lifecycle Management:** Bound the database connection to the FastAPI `lifespan` event, ensuring safe startup and graceful shutdown.
*   **Shared State:** Configured the Python service to read directly from the cloud MongoDB cluster populated by the Node.js seeder, ensuring a single source of truth.

### 3. Feature Engineering & Vectorization Pipeline
*   **Objective:** Translate raw anime metadata into mathematical representations for similarity comparisons.
*   **Dimensionality Upgrade:** Engineered a **71-Dimensional** feature vector consisting of:
    *   19 Dimensions: Multi-hot encoded Genres.
    *   50 Dimensions: Weighted Tags (ranked 0-100) extracted from the top 50 most frequent tags in the dataset (e.g., "Anti-Hero", "Time Manipulation").
    *   2 Dimensions: Normalized Average Score and Popularity.
*   **Data Processing:** Created an asynchronous script (`vectorize_data.py`) that successfully processed 1,000 anime documents, generating vectors and upserting them into the dedicated `animemls` collection.

### 4. Recommendation Engine & Explainable AI (XAI)
*   **Implementation:** Developed `RecommenderService` using `scikit-learn`'s Cosine Similarity.
*   **Dynamic Taste Vector:** The engine calculates a "User Taste Vector" by aggregating the feature vectors of the user's **10 most recently updated** anime, ensuring recommendations evolve with shifting interests.
*   **Cold Start Handling:** Implemented a fallback mechanism to suggest high-rated/popular anime for new users with empty lists.
*   **Explainable AI (XAI):** Built a logic layer that compares the user's vector against recommended vectors to generate natural language explanations (e.g., *"Because you enjoy Action and Fantasy series"*).

### 5. "Anime DNA" Spatial Visualizer
*   **Implementation:** Utilized the `umap-learn` algorithm to project the complex 71D feature vectors into a 2D ($x, y$) space, maintaining local and global clustering structures.
*   **Pre-computation:** Developed `generate_embeddings.py` to calculate these projections and store them back in the MongoDB `animemls` collection. This ensures instant $O(1)$ read performance for the frontend.
*   **Normalization:** Scaled coordinates to a consistent 0-100 range for seamless UI rendering.

### 6. Node.js Gateway Proxying
*   **Implementation:** Created an `mlService.js` utility in the Node.js backend using `axios` to communicate with the FastAPI service.
*   **Security:** Exposed the ML features to the frontend via authenticated Node.js routes (`/api/recommend` and `/api/anime/dna`), keeping the Python service isolated and centralizing JWT validation.

---

## Phase 3: The Intelligence UI (Frontend)
**Objective:** Consume the ML data streams and render them in a cinematic, highly interactive React application.

### 1. Intelligence UI (Top Picks & XAI)
*   **Implementation:** Integrated personalized recommendations into the `Home.jsx` dashboard.
*   **Visual Enhancements:** 
    *   Upgraded `AnimeCard.jsx` to parse and display the XAI reasoning in a styled "Zap" badge.
    *   Implemented robust data handling to manage complex nested objects (e.g., parsing `{english, romaji}` title objects safely).
    *   Added staggered `framer-motion` entrance animations and pulse-loading states.
*   **Data Accuracy:** Corrected image mapping (`coverImage`) and release date extraction to ensure pristine UI presentation.

### 2. The "Anime Galaxy" Map
*   **Implementation:** Built `Galaxy.jsx`, a dedicated spatial visualization page using `Recharts` (ScatterPlot).
*   **Aesthetics:** Designed a deep-space theme with glowing star points, where colors represent primary genres (e.g., Action = Red, Sci-Fi = Blue).
*   **Interactive Features:**
    *   **Smart Search:** Added a real-time search bar with a dropdown menu. Matching searches highlight specific stars by increasing their size and opacity while dimming the background universe.
    *   **Cluster Focus:** Clicking a star automatically isolates its specific genre "neighborhood" and opens a sidebar listing all localized anime, enabling intuitive discovery.

### 3. Global Analytics Dashboard (Data Science)
*   **Implementation:** Transformed the platform into a macro-intelligence tool by building `Analytics.jsx`.
*   **Backend Aggregation:** Engineered complex MongoDB aggregation pipelines to extract high-value insights.
*   **Visualized Metrics:**
    *   **Studio Quality Leaders:** A Bar Chart ranking the Top 15 animation studios based on their Average Critic Score (normalized to a 0-10 scale), strictly filtered to studios with a minimum of 10 works to ensure statistical significance.
    *   **Genre Quality Spectrum:** A Radar Chart visualizing the average quality (0-10) across major genres.
    *   **High-Res Yearly Genre Evolution:** A multi-line Area Chart plotting year-by-year average scores for the top 5 dominant genres from 2000 to present, complete with anime count data in the tooltips.

---

## System Status & Next Steps
The Satori platform now possesses a fully functional, cloud-connected Machine Learning backend and a cinematic, responsive frontend. The knowledge base has been successfully expanded to **1,000 anime** with deep metadata. 

**Architectural Integrity Checklist:**
- [x] TDD conventions followed for all major services.
- [x] Secure proxying established via Node.js Gateway.
- [x] Async data processing pipelines operational.
- [x] Responsive, Framer-Motion enhanced UI deployed.

The system is stable, performant, and ready for further feature expansion or production deployment preparations.
