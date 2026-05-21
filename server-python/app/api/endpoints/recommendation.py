from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from app.services.recommender import RecommenderService
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List

router = APIRouter()

class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = 10

class RecommendationResponse(BaseModel):
    anime_id: int
    title: str
    similarity_score: float
    xai_reason: str

@router.post("/", response_model=List[RecommendationResponse])
async def get_recommendations(
    request: RecommendationRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    recommender = RecommenderService(db)
    try:
        recommendations = await recommender.get_recommendations(request.user_id, request.limit)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
