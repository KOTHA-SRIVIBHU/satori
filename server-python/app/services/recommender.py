import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.vectorizer import ALL_TAGS
from typing import List, Dict

class RecommenderService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def get_recommendations(self, user_id: str, limit: int = 10):
        # 1. Fetch User
        user = await self.db["users"].find_one({"_id": user_id})
        if not user:
            user = await self.db["users"].find_one() # Fallback for demo
            
        full_list = user.get("animeList", [])
        if not full_list:
            return await self._get_cold_start_recommendations(limit)

        # 2. Get recent watches
        sorted_list = sorted(full_list, key=lambda x: x.get("updatedAt", 0), reverse=True)
        # Take up to 20 recent anime to represent current taste profile
        recent_ids = [item["animeId"] for item in sorted_list[:20]]
        all_watched_ids = [item["animeId"] for item in full_list]
        
        # 3. Fetch vectors for watched items
        watched_docs = await self.db["animemls"].find({"anime_id": {"$in": recent_ids}}).to_list(length=100)
        if not watched_docs:
            watched_docs = await self.db["animemls"].find({"anime_id": {"$in": all_watched_ids}}).to_list(length=100)
        if not watched_docs:
            return await self._get_cold_start_recommendations(limit)
            
        watched_vectors = [doc["feature_vector"] for doc in watched_docs]
        watched_titles = [doc["title"] for doc in watched_docs]
        
        # 4. Fetch all potential candidates
        all_ml_docs = await self.db["animemls"].find({"anime_id": {"$nin": all_watched_ids}}).to_list(length=2000)
        if not all_ml_docs:
            return []
            
        candidate_vectors = [doc["feature_vector"] for doc in all_ml_docs]
        
        # 5. Advanced Similarity Matrix
        # shape: (num_candidates, num_watched)
        sim_matrix = cosine_similarity(candidate_vectors, watched_vectors)
        
        results = []
        for i, doc in enumerate(all_ml_docs):
            # Find the closest watched anime for this candidate
            similarities_to_watched = sim_matrix[i]
            
            # Get top 2 closest watched anime indices
            top_indices = np.argsort(similarities_to_watched)[-2:][::-1]
            top_scores = similarities_to_watched[top_indices]
            
            # Score is heavily weighted towards the absolute closest match
            final_score = top_scores[0] * 0.7 + (top_scores[1] if len(top_scores) > 1 else 0) * 0.3
            
            closest_watched = watched_titles[top_indices[0]]
            second_closest = watched_titles[top_indices[1]] if len(top_indices) > 1 else None
            
            # Extract title properly if it's an object
            def get_title(t):
                if isinstance(t, dict):
                    return t.get("english") or t.get("romaji") or "Unknown"
                return str(t)
                
            closest_title = get_title(closest_watched)
            second_title = get_title(second_closest) if second_closest else None

            # Generate smart XAI reason
            if top_scores[0] > 0.85 and second_title:
                xai = f"Highly recommended because of your interest in {closest_title} and {second_title}."
            elif top_scores[0] > 0.75:
                xai = f"Because you watched {closest_title}."
            else:
                xai = self._generate_fallback_xai(doc["feature_vector"])

            results.append({
                "anime_id": doc["anime_id"],
                "title": doc["title"],
                "similarity_score": float(final_score),
                "xai_reason": xai
            })
            
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:limit]

    async def _get_cold_start_recommendations(self, limit: int):
        score_idx = len(ALL_TAGS)
        pop_idx = len(ALL_TAGS) + 1
        docs = await self.db["animemls"].find().sort([(f"feature_vector.{score_idx}", -1), (f"feature_vector.{pop_idx}", -1)]).to_list(length=limit)
        return [{
            "anime_id": doc["anime_id"],
            "title": doc["title"],
            "similarity_score": 1.0,
            "xai_reason": "Trending popular choice for new users!"
        } for doc in docs]

    def _generate_fallback_xai(self, anime_vector: np.array) -> str:
        tag_overlaps = []
        for i, tag_name in enumerate(ALL_TAGS):
            if anime_vector[i] > 0.4:
                tag_overlaps.append((tag_name, anime_vector[i]))
        tag_overlaps.sort(key=lambda x: x[1], reverse=True)
        top_tags = [t[0] for t in tag_overlaps[:2]]
        
        if top_tags:
            return f"Matches your taste profile, featuring {top_tags[0]} and {top_tags[1]}."
        return "Because it aligns with your overall viewing patterns."
