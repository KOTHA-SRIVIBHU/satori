import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.vectorizer import GENRES
from typing import List, Dict

class RecommenderService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def get_recommendations(self, user_id: str, limit: int = 10):
        # 1. Fetch User
        user = await self.db["users"].find_one({"_id": user_id})
        if not user:
            user = await self.db["users"].find_one() # Fallback for demo
            
        # Get all anime in list
        full_list = user.get("animeList", [])
        if not full_list:
            return await self._get_cold_start_recommendations(limit)

        # 2. Sort by updatedAt (descending) and take top 10 for "Dynamic Recs"
        # If updatedAt is missing (old records), it will be at the end
        sorted_list = sorted(full_list, key=lambda x: x.get("updatedAt", 0), reverse=True)
        recent_ids = [item["animeId"] for item in sorted_list[:10]]
        all_watched_ids = [item["animeId"] for item in full_list]
        
        # 3. Calculate User Taste Vector based on RECENT items
        watched_docs = await self.db["animemls"].find({"anime_id": {"$in": recent_ids}}).to_list(length=100)
        
        if not watched_docs:
            # Fallback to all watched if recent ones aren't in ML cache yet
            watched_docs = await self.db["animemls"].find({"anime_id": {"$in": all_watched_ids}}).to_list(length=100)

        if not watched_docs:
            return await self._get_cold_start_recommendations(limit)
            
        watched_vectors = [doc["feature_vector"] for doc in watched_docs]
        user_taste_vector = np.mean(watched_vectors, axis=0).reshape(1, -1)
        
        # 4. Fetch all potential candidates (excluding ALL watched)
        all_ml_docs = await self.db["animemls"].find({"anime_id": {"$nin": all_watched_ids}}).to_list(length=2000)
        
        if not all_ml_docs:
            return []
            
        candidate_vectors = [doc["feature_vector"] for doc in all_ml_docs]
        
        # 4. Similarity Search
        similarities = cosine_similarity(user_taste_vector, candidate_vectors)[0]
        
        # 5. Top-K Selection & XAI
        results = []
        for idx, score in enumerate(similarities):
            doc = all_ml_docs[idx]
            results.append({
                "anime_id": doc["anime_id"],
                "title": doc["title"],
                "similarity_score": float(score),
                "xai_reason": self._generate_xai_reason(user_taste_vector[0], doc["feature_vector"])
            })
            
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:limit]

    async def _get_cold_start_recommendations(self, limit: int):
        # Return high score/popularity anime
        docs = await self.db["animemls"].find().sort([("feature_vector.19", -1), ("feature_vector.20", -1)]).to_list(length=limit)
        return [{
            "anime_id": doc["anime_id"],
            "title": doc["title"],
            "similarity_score": 1.0,
            "xai_reason": "Trending popular choice for new users!"
        } for doc in docs]

    def _generate_xai_reason(self, user_vector: np.array, anime_vector: np.array) -> str:
        # Identify top contributing dimensions (genres)
        # Genres are the first len(GENRES) elements
        genre_overlaps = []
        for i, genre_name in enumerate(GENRES):
            if user_vector[i] > 0.2 and anime_vector[i] > 0.5:
                genre_overlaps.append(genre_name)
        
        if not genre_overlaps:
            # Fallback to score/popularity
            if anime_vector[19] > 0.8:
                return "Because it's highly rated among critics."
            return "Because it matches your overall taste patterns."
            
        top_genres = genre_overlaps[:3]
        if len(top_genres) == 1:
            return f"Because you enjoy {top_genres[0]} anime."
        return f"Because you enjoy {' and '.join([', '.join(top_genres[:-1]), top_genres[-1]])} series."
