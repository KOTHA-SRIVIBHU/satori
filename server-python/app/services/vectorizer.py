import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

TOP_TAGS = ['Male Protagonist', 'Heterosexual', 'Tragedy', 'Female Protagonist', 'School', 'Ensemble Cast', 'Primarily Teen Cast', 'Shounen', 'Urban Fantasy', 'Kuudere', 'Super Power', 'Coming of Age', 'Gore', 'Nudity', 'Urban', 'Tsundere', 'Primarily Adult Cast', 'Philosophy', 'Anti-Hero', 'Swordplay', 'CGI', 'Magic', 'Love Triangle', 'Primarily Female Cast', 'Female Harem', 'Revenge', 'Slapstick', 'Primarily Male Cast', 'Body Horror', 'Demons', 'Guns', 'Unrequited Love', 'Episodic', 'School Club', 'Travel', 'Time Skip', 'Seinen', 'Politics', 'Medieval', 'Gods', 'Conspiracy', 'Found Family', 'Tomboy', 'Bullying', 'War', 'LGBTQ+ Themes', 'Crime', 'Suicide', 'Time Manipulation', 'Isekai']

GENRES = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
    "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", 
    "Psychological", "Romance", "Sci-Fi", "Slice of Life", 
    "Sports", "Supernatural", "Thriller", "Ecchi", "Hentai"
]

class VectorizerService:
    @staticmethod
    def vectorize(anime):
        # 1. Multi-hot Genre Encoding (19 dim)
        genre_vector = [1.0 if g in anime.genres else 0.0 for g in GENRES]
        
        # 2. Weighted Tag Encoding (50 dim)
        # Using .name and .rank attributes since pydantic converts them to objects
        tag_dict = {tag.name: tag.rank for tag in anime.tags}
        tag_vector = [tag_dict.get(t, 0.0) / 100.0 for t in TOP_TAGS]
        
        # 3. Score Normalization (1 dim)
        score_norm = (anime.averageScore or 0) / 100.0
        
        # 4. Popularity Normalization (1 dim)
        pop_norm = min((anime.popularity or 0) / 1000000.0, 1.0)
        
        vector = genre_vector + tag_vector + [score_norm, pop_norm]
        return vector
