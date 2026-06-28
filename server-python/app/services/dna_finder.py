import numpy as np
from sklearn.cluster import KMeans
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.vectorizer import ALL_TAGS, ALL_GENRES
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

# Status weights for DNA calculation (same philosophy as recommender)
STATUS_WEIGHTS = {
    "COMPLETED": 1.0,
    "CURRENT": 0.9,
    "REPEATING": 1.3,
    "PLANNING": 0.2,
    "PAUSED": 0.0,
    "DROPPED": 0.0,
}

# Data-driven persona archetypes keyed by dominant genre/tag patterns.
# Each archetype defines trigger_tags (what activates it) and a threshold.
ARCHETYPES = [
    {
        "name": "The Battle Shounen Junkie",
        "description": "You live for high-stakes tournaments, screaming power-ups, and epic rivalries that push heroes past their limits.",
        "triggers": ["Super Power", "Martial Arts", "Swordplay", "Battle Royale", "Anti-Hero", "Shounen"],
        "genre_triggers": ["Action"],
    },
    {
        "name": "The Isekai Addict",
        "description": "You can't get enough of being reincarnated as an overpowered protagonist in a fantasy world with magic and dungeon crawling.",
        "triggers": ["Isekai", "Reincarnation", "Dungeon", "Cultivation", "Kingdom Management", "Reverse Isekai"],
        "genre_triggers": ["Fantasy"],
    },
    {
        "name": "The Romance & Drama Connoisseur",
        "description": "You thrive on emotional coming-of-age stories, love triangles, unrequited love, and tearful confessions.",
        "triggers": ["Love Triangle", "Unrequited Love", "Coming of Age", "School", "Marriage", "Cohabitation", "Fake Relationship"],
        "genre_triggers": ["Romance", "Drama"],
    },
    {
        "name": "The Edge Lord",
        "description": "Dark urban fantasy, crime, anti-heroes, and psychological thrillers with gore and moral ambiguity define your watchlist.",
        "triggers": ["Gore", "Crime", "Anti-Hero", "Revenge", "Conspiracy", "Torture", "Death Game", "Survival"],
        "genre_triggers": ["Thriller", "Psychological", "Horror"],
    },
    {
        "name": "The Moe Enthusiast",
        "description": "You love cute characters doing cute things, magical girls, lighthearted adventures, and heartwarming comedy.",
        "triggers": ["Cute Girls Doing Cute Things", "Cute Boys Doing Cute Things", "Iyashikei", "School Club", "Chibi"],
        "genre_triggers": ["Mahou Shoujo", "Comedy", "Slice of Life"],
    },
    {
        "name": "The Slice-of-Life Philosopher",
        "description": "You enjoy grounded, relaxing shows about work, family life, food, and adults navigating everyday existence.",
        "triggers": ["Work", "Family Life", "Food", "Rural", "Camping", "Restaurant", "Agriculture", "Iyashikei", "Office"],
        "genre_triggers": ["Slice of Life"],
    },
    {
        "name": "The War Scholar",
        "description": "Deep philosophy, military tactics, political intrigue, and post-apocalyptic suffering are what captivate you.",
        "triggers": ["War", "Military", "Politics", "Post-Apocalyptic", "Dystopian", "Philosophy", "Terrorism", "Tanks"],
        "genre_triggers": ["Action", "Drama"],
    },
    {
        "name": "The Sci-Fi Voyager",
        "description": "Space operas, cyberpunk cities, mecha battles, and AI-driven narratives fuel your imagination.",
        "triggers": ["Space", "Space Opera", "Cyberpunk", "Robots", "Artificial Intelligence", "Mecha", "Cyborg", "Steampunk"],
        "genre_triggers": ["Sci-Fi", "Mecha"],
    },
    {
        "name": "The Mystery Detective",
        "description": "You're drawn to whodunits, psychological puzzles, conspiracies, and crime dramas that keep you guessing.",
        "triggers": ["Detective", "Conspiracy", "Crime", "Espionage", "Police", "Noir"],
        "genre_triggers": ["Mystery", "Psychological"],
    },
    {
        "name": "The Sports Fanatic",
        "description": "You feel the rush of competition through basketball courts, boxing rings, and volleyball matches.",
        "triggers": ["Basketball", "Boxing", "Volleyball", "Baseball", "Tennis", "Swimming", "Football", "Athletics", "Cycling", "Wrestling"],
        "genre_triggers": ["Sports"],
    },
    {
        "name": "The Supernatural Explorer",
        "description": "Ghosts, demons, exorcisms, and the boundary between the living and the dead fascinate you endlessly.",
        "triggers": ["Demons", "Ghost", "Exorcism", "Youkai", "Angels", "Gods", "Vampire", "Zombie", "Necromancy", "Afterlife"],
        "genre_triggers": ["Supernatural"],
    },
    {
        "name": "The Harem Protagonist",
        "description": "School settings, tsunderes, love triangles, and lively romantic comedy with a charming cast are your comfort zone.",
        "triggers": ["Female Harem", "Male Harem", "Mixed Gender Harem", "Tsundere", "Love Triangle", "School"],
        "genre_triggers": ["Romance", "Ecchi", "Comedy"],
    },
]


class DNAFinderService:
    _kmeans_model = None

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def analyze_user_dna(self, user_id: str):
        from bson import ObjectId

        # 1. Fetch user
        try:
            user = await self.db["users"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None

        full_list = user.get("animeList", []) if user else []
        if not full_list:
            return {
                "persona": "The Newcomer",
                "description": "You haven't watched enough anime yet! Explore our recommendations to start building your DNA.",
                "cluster_id": -1,
                "total_watched": 0,
                "top_tags": [],
                "top_genres": [],
                "genre_breakdown": [],
                "secondary_persona": None,
            }

        # 2. Build weight map from status + score
        weighted_ids = []
        for item in full_list:
            status = item.get("status", "PLANNING")
            score = item.get("score", 0)
            status_w = STATUS_WEIGHTS.get(status, 0.2)

            if status_w <= 0:
                continue  # skip DROPPED/PAUSED

            # Score multiplier
            if score == 0:
                score_w = 0.5
            elif score <= 4:
                score_w = 0.2
            elif score <= 6:
                score_w = 0.5
            elif score <= 8:
                score_w = 0.9
            else:
                score_w = 1.3

            weighted_ids.append({
                "animeId": item["animeId"],
                "weight": status_w * score_w,
            })

        if not weighted_ids:
            # Everything was dropped/paused
            weighted_ids = [{"animeId": item["animeId"], "weight": 0.5} for item in full_list[:20]]

        anime_ids = [w["animeId"] for w in weighted_ids]
        weight_map = {w["animeId"]: w["weight"] for w in weighted_ids}

        # 3. Fetch vectors
        watched_docs = await self.db["animemls"].find(
            {"anime_id": {"$in": anime_ids}}
        ).to_list(length=1000)

        if not watched_docs:
            return {
                "persona": "The Newcomer",
                "description": "Your watched anime haven't been vectorized yet. Try syncing your list first!",
                "cluster_id": -1,
                "total_watched": len(full_list),
                "top_tags": [],
                "top_genres": [],
                "genre_breakdown": [],
                "secondary_persona": None,
            }

        # 4. Compute weighted taste vector
        vectors = []
        weights = []
        for doc in watched_docs:
            vec = np.array(doc["feature_vector"])
            w = weight_map.get(doc["anime_id"], 0.5)
            vectors.append(vec)
            weights.append(w)

        vectors = np.array(vectors)
        weights = np.array(weights)
        weight_sum = weights.sum()
        if weight_sum > 0:
            weights = weights / weight_sum

        taste_vector = np.average(vectors, axis=0, weights=weights)

        # 5. Extract top tags from the taste vector
        tag_scores = []
        for i, tag_name in enumerate(ALL_TAGS):
            if i < len(taste_vector) and taste_vector[i] > 0.01:
                tag_scores.append({"tag": tag_name, "strength": round(float(taste_vector[i]) * 100, 1)})
        tag_scores.sort(key=lambda x: x["strength"], reverse=True)
        top_tags = tag_scores[:15]

        # 6. Extract genre breakdown
        genre_start = len(ALL_TAGS)
        genre_scores = []
        for i, genre_name in enumerate(ALL_GENRES):
            idx = genre_start + i
            if idx < len(taste_vector):
                val = float(taste_vector[idx])
                if val > 0.001:
                    genre_scores.append({"genre": genre_name, "strength": round(val * 100, 1)})

        # If genre dimensions are near-zero (common when tags are rich), 
        # derive genre affinity from tag patterns in the raw anime data
        if not genre_scores or max(g["strength"] for g in genre_scores) < 1.0:
            genre_scores = await self._derive_genres_from_watchlist(anime_ids, weight_map)

        genre_scores.sort(key=lambda x: x["strength"], reverse=True)
        top_genres = genre_scores[:8]

        # 7. Match to archetype using tag + genre affinity scoring
        primary, secondary = self._match_archetypes(top_tags, top_genres)

        # 8. K-Means cluster ID (for backwards compat with frontend)
        cluster_id = await self._get_cluster_id(taste_vector)

        return {
            "cluster_id": cluster_id,
            "persona": primary["name"],
            "description": primary["description"],
            "total_watched": len(watched_docs),
            "top_tags": top_tags,
            "top_genres": top_genres,
            "genre_breakdown": top_genres,
            "secondary_persona": {
                "name": secondary["name"],
                "description": secondary["description"],
            } if secondary else None,
        }

    async def _derive_genres_from_watchlist(self, anime_ids: list, weight_map: dict) -> list:
        """Derive genre affinity directly from the anime metadata when vector genre dims are sparse."""
        docs = await self.db["animecaches"].find(
            {"_id": {"$in": anime_ids}},
            {"genres": 1}
        ).to_list(length=1000)

        genre_acc = {}
        total_weight = 0
        for doc in docs:
            w = weight_map.get(doc["_id"], 0.5)
            total_weight += w
            for genre in doc.get("genres", []):
                genre_acc[genre] = genre_acc.get(genre, 0) + w

        if total_weight == 0:
            return []

        return [
            {"genre": genre, "strength": round((score / total_weight) * 100, 1)}
            for genre, score in genre_acc.items()
        ]

    def _match_archetypes(self, top_tags: list, top_genres: list):
        """Score each archetype against the user's tag/genre profile and return primary + secondary."""
        tag_set = {t["tag"]: t["strength"] for t in top_tags}
        genre_set = {g["genre"]: g["strength"] for g in top_genres}

        scores = []
        for archetype in ARCHETYPES:
            score = 0.0

            # Tag trigger matching (weighted by user's actual tag strength)
            for trigger in archetype["triggers"]:
                if trigger in tag_set:
                    score += tag_set[trigger] * 0.6  # tags are primary signal

            # Genre trigger matching
            for genre in archetype["genre_triggers"]:
                if genre in genre_set:
                    score += genre_set[genre] * 0.4  # genres are secondary signal

            scores.append((archetype, score))

        scores.sort(key=lambda x: x[1], reverse=True)

        primary = scores[0][0] if scores[0][1] > 0 else {
            "name": "The Enigma",
            "description": "Your taste is beautifully unique — it defies all conventional categorization."
        }

        secondary = None
        if len(scores) > 1 and scores[1][1] > scores[0][1] * 0.4:
            # Only show secondary if it's at least 40% as strong as primary
            secondary = scores[1][0]

        return primary, secondary

    async def _get_cluster_id(self, taste_vector: np.ndarray) -> int:
        """Run K-Means for backwards-compatible cluster_id."""
        try:
            if DNAFinderService._kmeans_model is None:
                docs = await self.db["animemls"].find().to_list(length=2000)
                vectors = [doc["feature_vector"] for doc in docs if "feature_vector" in doc]
                if not vectors:
                    return -1
                model = KMeans(n_clusters=8, random_state=42, n_init=10)
                model.fit(vectors)
                DNAFinderService._kmeans_model = model

            cluster = DNAFinderService._kmeans_model.predict(taste_vector.reshape(1, -1))[0]
            return int(cluster)
        except Exception:
            return -1
