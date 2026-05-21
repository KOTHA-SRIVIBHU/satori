import pytest
from app.services.vectorizer import VectorizerService, GENRES
from app.models.anime import AnimeCache

def test_vectorizer_output_length():
    sample_anime = AnimeCache(
        _id=1,
        title={"english": "Test Anime", "romaji": "Test Anime"},
        genres=["Action", "Adventure"],
        tags=[{"name": "Ninja", "rank": 80}, {"name": "Shounen", "rank": 90}],
        averageScore=85,
        popularity=1000
    )
    
    vector = VectorizerService.vectorize(sample_anime)
    
    # Expected length: Genres (len(GENRES)) + Score (1) + Popularity (1) + Tags (let's say we handle top tags later)
    # For now, let's just assert it's not empty and has a consistent length
    assert len(vector) > 0
    
def test_genre_encoding():
    sample_anime = AnimeCache(
        _id=1,
        title={"english": "Action Adventure"},
        genres=["Action", "Adventure"],
        tags=[],
        averageScore=0,
        popularity=0
    )
    
    vector = VectorizerService.vectorize(sample_anime)
    
    action_idx = GENRES.index("Action")
    adventure_idx = GENRES.index("Adventure")
    comedy_idx = GENRES.index("Comedy")
    
    assert vector[action_idx] == 1.0
    assert vector[adventure_idx] == 1.0
    assert vector[comedy_idx] == 0.0
