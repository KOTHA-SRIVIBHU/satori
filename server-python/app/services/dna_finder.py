import numpy as np
from sklearn.cluster import KMeans
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.vectorizer import ALL_TAGS
import logging

logger = logging.getLogger(__name__)

# Hardcoded personas based on theoretical clusters (random_state=42)
PERSONAS = {
    0: {"name": "The Moe / Magic Enthusiast", "description": "You love cute girls doing cute things, magical girls, and lighthearted episodic adventures."},
    1: {"name": "The Battle Shounen Junkie", "description": "You live for high-stakes tournaments, screaming power-ups, super powers, and epic rivalries."},
    2: {"name": "The Harem Protagonist", "description": "School settings, tsunderes, love triangles, and copious amounts of fan-service are your bread and butter."},
    3: {"name": "The Edge Lord", "description": "Dark urban fantasy, crime, anti-heroes, and psychological thrillers with plenty of gore."},
    4: {"name": "The Romance & Drama Fan", "description": "You thrive on high school romance, emotional coming-of-age stories, love triangles, and tears."},
    5: {"name": "The Slice-of-Life Casual", "description": "You enjoy relaxing, grounded shows about work, family life, and adults just trying to get by."},
    6: {"name": "The War Scholar", "description": "Deep philosophy, military tactics, revenge, war, and post-apocalyptic suffering are what you seek."},
    7: {"name": "The Isekai Addict", "description": "You can't get enough of being reincarnated as an overpowered protagonist in a fantasy world with magic."}
}

class DNAFinderService:
    _kmeans_model = None

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def _train_model(self):
        logger.info("Training K-Means DNA model...")
        docs = await self.db["animemls"].find().to_list(length=2000)
        vectors = [doc["feature_vector"] for doc in docs if "feature_vector" in doc]
        
        if not vectors:
            raise ValueError("No data available for clustering")
            
        model = KMeans(n_clusters=8, random_state=42, n_init=10)
        model.fit(vectors)
        DNAFinderService._kmeans_model = model
        logger.info("DNA model training complete.")

    async def analyze_user_dna(self, user_id: str):
        if DNAFinderService._kmeans_model is None:
            await self._train_model()
            
        from bson import ObjectId
        try:
            user = await self.db["users"].find_one({"_id": ObjectId(user_id)})
        except:
            user = None
        if not user:
            user = await self.db["users"].find_one() # Fallback for demo
            
        full_list = user.get("animeList", []) if user else []
        if not full_list:
            return {"persona": "The Newcomer", "description": "You haven't watched enough anime yet! Explore our recommendations.", "cluster_id": -1, "total_watched": 0}
            
        watched_ids = [item["animeId"] for item in full_list]
        watched_docs = await self.db["animemls"].find({"anime_id": {"$in": watched_ids}}).to_list(length=1000)
        
        if not watched_docs:
             return {"persona": "The Newcomer", "description": "You haven't watched enough anime yet! Explore our recommendations.", "cluster_id": -1, "total_watched": len(full_list)}
             
        watched_vectors = [doc["feature_vector"] for doc in watched_docs]
        
        # Predict the cluster for EVERY anime watched
        predictions = DNAFinderService._kmeans_model.predict(watched_vectors)
        
        # Find the most frequent cluster (the mode)
        unique_clusters, counts = np.unique(predictions, return_counts=True)
        most_frequent_idx = np.argmax(counts)
        cluster_id = unique_clusters[most_frequent_idx]
        
        persona = PERSONAS.get(int(cluster_id), {"name": "The Enigma", "description": "Your taste defies categorization."})
        
        return {
            "cluster_id": int(cluster_id),
            "persona": persona["name"],
            "description": persona["description"],
            "total_watched": len(watched_vectors)
        }
