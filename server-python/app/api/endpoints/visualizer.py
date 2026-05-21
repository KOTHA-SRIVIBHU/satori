from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class AnimeDNA(BaseModel):
    id: int
    title: str
    x: float
    y: float
    genres: List[str]

@router.get("/", response_model=List[AnimeDNA])
async def get_anime_dna(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # Join with animecaches to get genres, or we can just fetch from animemls if we had stored them
        # Let's fetch from animemls and also lookup in animecaches for genres
        # For performance in this task, let's assume animemls has what we need or do a simple join
        
        pipeline = [
            {
                "$lookup": {
                    "from": "animecaches",
                    "localField": "anime_id",
                    "foreignField": "_id",
                    "as": "raw_data"
                }
            },
            {
                "$unwind": "$raw_data"
            },
            {
                "$project": {
                    "id": "$anime_id",
                    "title": 1,
                    "x": {"$arrayElemAt": ["$embedding", 0]},
                    "y": {"$arrayElemAt": ["$embedding", 1]},
                    "genres": "$raw_data.genres"
                }
            }
        ]
        
        cursor = db["animemls"].aggregate(pipeline)
        results = await cursor.to_list(length=2000)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
