from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class AnimeTag(BaseModel):
    name: str
    rank: float

class AnimeTitle(BaseModel):
    romaji: Optional[str] = None
    english: Optional[str] = None

class AnimeCache(BaseModel):
    id: int = Field(alias="_id")
    title: AnimeTitle
    genres: List[str]
    tags: List[AnimeTag]
    averageScore: Optional[float] = 0
    popularity: Optional[float] = 0
    format: Optional[str] = None

class AnimeML(BaseModel):
    anime_id: int
    title: str
    feature_vector: List[float]
    # x, y coordinates for visualization/embedding later
    embedding: Optional[List[float]] = None 
