import numpy as np
import logging
from sklearn.ensemble import RandomForestRegressor
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.vectorizer import ALL_TAGS

logger = logging.getLogger(__name__)

class TrendPredictorService:
    _model = None
    _features_cache = []
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    def _extract_features(self, doc):
        """Extracts numerical features from an anime document."""
        # 1. Release month (Cyclical encoding is better, but raw integer works for trees)
        month = doc.get("startDate", {}).get("month", 1)
        if month is None: month = 1
        
        # 2. Format (One-hotish approximation)
        fmt = doc.get("format", "TV")
        is_tv = 1.0 if fmt == "TV" else 0.0
        is_movie = 1.0 if fmt == "MOVIE" else 0.0
        
        # 3. Tag weights
        tag_dict = {tag["name"]: tag["rank"] for tag in doc.get("tags", [])}
        tag_vector = [(tag_dict.get(t, 0.0) / 100.0) for t in ALL_TAGS]
        
        return [month, is_tv, is_movie] + tag_vector

    async def _train_model(self):
        logger.info("Training Trend Predictor Model...")
        docs = await self.db["animecaches"].find({"popularity": {"$ne": None}, "startDate.year": {"$lte": 2022}}).to_list(length=5000)
        
        if not docs:
            logger.warning("No data found for training trend predictor (<=2022). Trying all data.")
            docs = await self.db["animecaches"].find({"popularity": {"$ne": None}}).to_list(length=5000)
            
        X = []
        y = []
        for doc in docs:
            X.append(self._extract_features(doc))
            y.append(doc["popularity"])
            
        # Train Random Forest
        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X, y)
        TrendPredictorService._model = model
        logger.info(f"Trend Predictor trained on {len(docs)} samples.")

    async def get_seasonal_predictions(self, target_year: int = 2023):
        if TrendPredictorService._model is None:
            await self._train_model()
            
        # Fetch anime from the target year (e.g. upcoming/recent season)
        docs = await self.db["animecaches"].find({"startDate.year": {"$gte": target_year}}).to_list(length=500)
        
        if not docs:
            return []
            
        X_test = []
        for doc in docs:
            X_test.append(self._extract_features(doc))
            
        predictions = TrendPredictorService._model.predict(X_test)
        
        results = []
        for doc, pred in zip(docs, predictions):
            results.append({
                "anime_id": doc["_id"],
                "title": doc.get("title", {}).get("english") or doc.get("title", {}).get("romaji", "Unknown"),
                "image": doc.get("coverImage"),
                "actual_popularity": doc.get("popularity", 0),
                "predicted_popularity": float(pred),
                "format": doc.get("format", "Unknown"),
                "release_month": doc.get("startDate", {}).get("month", 1)
            })
            
        # Sort by predicted popularity descending
        results.sort(key=lambda x: x["predicted_popularity"], reverse=True)
        return results[:20]

    async def predict_hypothetical(self, tags: list, format: str, month: int):
        """Allows users to predict popularity of a custom made-up anime."""
        if TrendPredictorService._model is None:
            await self._train_model()
            
        is_tv = 1.0 if format == "TV" else 0.0
        is_movie = 1.0 if format == "MOVIE" else 0.0
        
        tag_dict = {t: 100 for t in tags} # Assume max rank for user selected tags
        tag_vector = [(tag_dict.get(t, 0.0) / 100.0) for t in ALL_TAGS]
        
        X = [[month, is_tv, is_movie] + tag_vector]
        pred = TrendPredictorService._model.predict(X)[0]
        return {"predicted_popularity": float(pred)}
