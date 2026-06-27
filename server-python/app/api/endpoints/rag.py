from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.rag_engine import generate_anime_insight

router = APIRouter()

class RAGRequest(BaseModel):
    messages: List[Dict[str, str]]
    watch_history: List[Dict[str, Any]] = []
    dna_markers: Dict[str, float] = {}
    custom_lists: List[Dict[str, Any]] = []

class RAGResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=RAGResponse)
async def chat_with_satori(request: RAGRequest):
    try:
        answer = generate_anime_insight(
            messages=request.messages,
            watch_history=request.watch_history,
            dna_markers=request.dna_markers,
            custom_lists=request.custom_lists
        )
        return RAGResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
