from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List, Optional, Any

router = APIRouter()

class AnimeDNA(BaseModel):
    id: int
    title: Any
    x: float
    y: float
    genres: Optional[List[str]] = []
    tags: Optional[List[dict]] = []

@router.get("/", response_model=List[AnimeDNA])
async def get_anime_dna(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
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
                    "_id": 0,
                    "id": "$anime_id",
                    "title": 1,
                    "x": {"$arrayElemAt": ["$embedding", 0]},
                    "y": {"$arrayElemAt": ["$embedding", 1]},
                    "genres": "$raw_data.genres",
                    "tags": "$raw_data.tags"
                }
            }
        ]
        
        cursor = db["animemls"].aggregate(pipeline)
        results = await cursor.to_list(length=2000)
        
        # Clean up any nested ObjectIds (like in tags array) before FastAPI serialization
        for doc in results:
            if "tags" in doc and isinstance(doc["tags"], list):
                for tag in doc["tags"]:
                    if "_id" in tag:
                        del tag["_id"]
                        
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
