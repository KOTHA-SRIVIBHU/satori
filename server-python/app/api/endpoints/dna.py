from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from app.services.dna_finder import DNAFinderService
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

router = APIRouter()

class DNARequest(BaseModel):
    user_id: str

class DNAResponse(BaseModel):
    cluster_id: int
    persona: str
    description: str
    total_watched: int

@router.post("/analyze", response_model=DNAResponse)
async def analyze_dna(
    request: DNARequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    service = DNAFinderService(db)
    try:
        result = await service.analyze_user_dna(request.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
