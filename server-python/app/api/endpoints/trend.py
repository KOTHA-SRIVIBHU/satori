from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from app.services.trend_predictor import TrendPredictorService
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List

router = APIRouter()

class HypotheticalRequest(BaseModel):
    tags: List[str]
    format: str = "TV"
    month: int = 1

@router.get("/seasonal")
async def get_seasonal_hits(
    target_year: int = 2023,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    service = TrendPredictorService(db)
    try:
        results = await service.get_seasonal_predictions(target_year)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hypothetical")
async def predict_hypothetical_anime(
    request: HypotheticalRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    service = TrendPredictorService(db)
    try:
        result = await service.predict_hypothetical(request.tags, request.format, request.month)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
