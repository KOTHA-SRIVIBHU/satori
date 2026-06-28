import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.vectorizer import ALL_TAGS, ALL_GENRES
from typing import List, Dict

# Status weights: how much each status contributes to the taste profile.
# DROPPED/PAUSED actively signal dislike, so they should be excluded or inverted.
STATUS_WEIGHTS = {
    "COMPLETED": 1.0,
    "CURRENT": 0.9,
    "REPEATING": 1.2,   # Rewatching = strong signal of love
    "PLANNING": 0.3,    # Mild interest signal, haven't actually watched
    "PAUSED": 0.0,      # Neutral — exclude from taste building
    "DROPPED": 0.0,     # Negative signal — exclude from taste building
}

# How many tags+genres dimensions exist (used to isolate content-only similarity)
CONTENT_DIMS = len(ALL_TAGS) + len(ALL_GENRES)


class RecommenderService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def get_recommendations(self, user_id: str, limit: int = 10):
        from bson import ObjectId

        # 1. Fetch User
        try:
            user = await self.db["users"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None

        if not user:
            return await self._get_cold_start_recommendations(limit)

        full_list = user.get("animeList", [])
        if not full_list:
            return await self._get_cold_start_recommendations(limit)

        # 2. Build weighted taste profile from watch history
        # Sort by recency, take up to 30 recent for broader taste capture
        sorted_list = sorted(full_list, key=lambda x: x.get("updatedAt", 0), reverse=True)
        recent_items = sorted_list[:30]
        all_watched_ids = [item["animeId"] for item in full_list]

        # Separate positive signal items from negative/neutral ones
        positive_items = []
        negative_ids = set()
        for item in recent_items:
            status = item.get("status", "PLANNING")
            score = item.get("score", 0)
            status_w = STATUS_WEIGHTS.get(status, 0.3)

            if status in ("DROPPED", "PAUSED"):
                negative_ids.add(item["animeId"])
                continue

            # Compute a combined weight from status and user score
            # Score weight: 0→0.5 (unrated), 1-4→0.3, 5-6→0.6, 7-8→0.9, 9-10→1.2
            if score == 0:
                score_w = 0.5  # unrated — neutral
            elif score <= 4:
                score_w = 0.3
            elif score <= 6:
                score_w = 0.6
            elif score <= 8:
                score_w = 0.9
            else:
                score_w = 1.2

            combined_weight = status_w * score_w
            if combined_weight > 0:
                positive_items.append({
                    "animeId": item["animeId"],
                    "weight": combined_weight,
                })

        if not positive_items:
            # All items are dropped/paused — fall back to all watched
            positive_items = [{"animeId": item["animeId"], "weight": 0.5} for item in recent_items]

        positive_ids = [item["animeId"] for item in positive_items]

        # 3. Fetch vectors for positive-signal watched items
        watched_docs = await self.db["animemls"].find(
            {"anime_id": {"$in": positive_ids}}
        ).to_list(length=100)

        if not watched_docs:
            # Broader fallback
            watched_docs = await self.db["animemls"].find(
                {"anime_id": {"$in": all_watched_ids}}
            ).to_list(length=100)

        if not watched_docs:
            return await self._get_cold_start_recommendations(limit)

        # Build weight lookup
        weight_map = {item["animeId"]: item["weight"] for item in positive_items}

        # 4. Compute weighted taste vector (centroid)
        # Only use content dimensions (tags + genres), exclude score/popularity to
        # avoid recommending purely based on popularity rather than thematic match
        watched_vectors = []
        watched_weights = []
        watched_titles = []
        watched_id_set = set()

        for doc in watched_docs:
            vec = np.array(doc["feature_vector"][:CONTENT_DIMS])  # content dims only
            w = weight_map.get(doc["anime_id"], 0.5)
            watched_vectors.append(vec)
            watched_weights.append(w)
            watched_titles.append(doc["title"])
            watched_id_set.add(doc["anime_id"])

        watched_vectors = np.array(watched_vectors)
        watched_weights = np.array(watched_weights)

        # Normalize weights to sum to 1
        weight_sum = watched_weights.sum()
        if weight_sum > 0:
            watched_weights = watched_weights / weight_sum

        # Weighted centroid = the user's "ideal anime" vector
        taste_vector = np.average(watched_vectors, axis=0, weights=watched_weights).reshape(1, -1)

        # 5. Fetch all candidates (exclude everything in the user's list)
        all_ml_docs = await self.db["animemls"].find(
            {"anime_id": {"$nin": all_watched_ids}}
        ).to_list(length=2000)

        if not all_ml_docs:
            return []

        candidate_vectors_full = [doc["feature_vector"] for doc in all_ml_docs]
        # Use content-only dimensions for candidates too
        candidate_vectors = np.array([v[:CONTENT_DIMS] for v in candidate_vectors_full])

        # 6. Compute similarity: candidate vs taste centroid
        centroid_scores = cosine_similarity(candidate_vectors, taste_vector).flatten()

        # Also compute per-item similarity for XAI reasons
        item_sim_matrix = cosine_similarity(candidate_vectors, watched_vectors)

        # 7. Score and rank candidates
        results = []
        for i, doc in enumerate(all_ml_docs):
            centroid_score = float(centroid_scores[i])

            # Find closest watched anime for XAI
            item_sims = item_sim_matrix[i]
            top_indices = np.argsort(item_sims)[-2:][::-1]
            top_sim = float(item_sims[top_indices[0]])

            # Blend: 70% centroid match (overall taste), 30% best item match (specific similarity)
            final_score = centroid_score * 0.7 + top_sim * 0.3

            # Slight quality bonus: boost anime with high community score (soft tiebreaker)
            full_vec = candidate_vectors_full[i]
            community_score = full_vec[CONTENT_DIMS] if len(full_vec) > CONTENT_DIMS else 0
            # Add up to 5% bonus for high-rated anime (score_norm is 0-1)
            quality_bonus = community_score * 0.05
            final_score += quality_bonus

            # Generate XAI reason
            closest_title = self._get_title(watched_titles[top_indices[0]])
            second_title = self._get_title(watched_titles[top_indices[1]]) if len(top_indices) > 1 else None

            xai = self._generate_xai(doc, top_sim, closest_title, second_title)

            results.append({
                "anime_id": doc["anime_id"],
                "title": doc["title"],
                "similarity_score": round(final_score, 4),
                "xai_reason": xai,
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        # 8. Diversity injection: avoid returning N anime from the same narrow cluster
        # Greedily pick top results but skip if too similar to an already-picked result
        diverse_results = self._inject_diversity(results, candidate_vectors, all_ml_docs, limit)

        return diverse_results

    def _inject_diversity(self, ranked_results, candidate_vectors, all_ml_docs, limit: int):
        """Greedily select top results while enforcing minimum diversity.
        
        If a candidate is >92% similar to an already-selected result, skip it
        unless we can't fill the list otherwise.
        """
        if len(ranked_results) <= limit:
            return ranked_results

        # Build a quick lookup: anime_id → index in all_ml_docs
        id_to_idx = {doc["anime_id"]: i for i, doc in enumerate(all_ml_docs)}

        selected = []
        selected_indices = []

        for result in ranked_results:
            if len(selected) >= limit:
                break

            idx = id_to_idx.get(result["anime_id"])
            if idx is None:
                selected.append(result)
                continue

            # Check similarity against already-selected items
            too_similar = False
            if selected_indices:
                sims = cosine_similarity(
                    candidate_vectors[idx].reshape(1, -1),
                    candidate_vectors[selected_indices]
                ).flatten()
                if np.max(sims) > 0.92:
                    too_similar = True

            if not too_similar:
                selected.append(result)
                selected_indices.append(idx)

        # If diversity filtering was too aggressive, fill remaining slots from ranked order
        if len(selected) < limit:
            selected_ids = {r["anime_id"] for r in selected}
            for result in ranked_results:
                if len(selected) >= limit:
                    break
                if result["anime_id"] not in selected_ids:
                    selected.append(result)

        return selected

    def _generate_xai(self, doc, top_sim: float, closest_title: str, second_title: str | None) -> str:
        """Generate an explainable AI reason based on similarity strength."""
        if top_sim > 0.85 and second_title:
            return f"Highly recommended because of your interest in {closest_title} and {second_title}."
        elif top_sim > 0.75:
            return f"Because you enjoyed {closest_title}."
        else:
            return self._generate_fallback_xai(doc["feature_vector"])

    @staticmethod
    def _get_title(t) -> str:
        if isinstance(t, dict):
            return t.get("english") or t.get("romaji") or "Unknown"
        return str(t) if t else "Unknown"

    async def _get_cold_start_recommendations(self, limit: int):
        """For new users: return high-quality, popular anime as sensible defaults."""
        score_idx = CONTENT_DIMS      # averageScore position
        pop_idx = CONTENT_DIMS + 1    # popularity position

        docs = await self.db["animemls"].find().sort([
            (f"feature_vector.{score_idx}", -1),
            (f"feature_vector.{pop_idx}", -1)
        ]).to_list(length=limit)

        return [{
            "anime_id": doc["anime_id"],
            "title": doc["title"],
            "similarity_score": 1.0,
            "xai_reason": "Top-rated series — a great starting point!"
        } for doc in docs]

    def _generate_fallback_xai(self, anime_vector) -> str:
        """Generate XAI from the anime's own dominant tags when similarity is low."""
        tag_overlaps = []
        for i, tag_name in enumerate(ALL_TAGS):
            if i < len(anime_vector) and anime_vector[i] > 0.4:
                tag_overlaps.append((tag_name, anime_vector[i]))
        tag_overlaps.sort(key=lambda x: x[1], reverse=True)
        top_tags = [t[0] for t in tag_overlaps[:3]]

        if len(top_tags) >= 2:
            return f"Matches your taste profile, featuring {top_tags[0]} and {top_tags[1]}."
        elif len(top_tags) == 1:
            return f"Matches your taste profile, featuring {top_tags[0]}."
        return "Aligns with your overall viewing patterns."
