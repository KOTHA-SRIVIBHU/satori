import pytest
import numpy as np
from unittest.mock import AsyncMock, MagicMock
from app.services.recommender import RecommenderService

@pytest.mark.anyio
async def test_recommender_logic():
    # Mock database
    mock_db = MagicMock()
    
    # Mock user
    mock_user = {
        "_id": "user_123",
        "animeList": [
            {"animeId": 1, "status": "COMPLETED"},
            {"animeId": 2, "status": "COMPLETED"}
        ]
    }
    
    # Mock watched ml docs
    watched_ml = [
        {"anime_id": 1, "title": "A", "feature_vector": [1.0] * 19 + [0.8, 0.8]},
        {"anime_id": 2, "title": "B", "feature_vector": [1.0] * 19 + [0.9, 0.9]}
    ]
    
    # Mock candidate ml docs
    candidates_ml = [
        {"anime_id": 3, "title": "Target Anime", "feature_vector": [1.0] * 19 + [0.85, 0.85]},
        {"anime_id": 4, "title": "Irrelevant Anime", "feature_vector": [0.0] * 19 + [0.1, 0.1]}
    ]
    
    # Configure mocks
    mock_db["users"].find_one = AsyncMock(return_value=mock_user)
    
    # Mock find().to_list()
    mock_cursor_watched = AsyncMock()
    mock_cursor_watched.to_list = AsyncMock(return_value=watched_ml)
    mock_db["animemls"].find.side_effect = lambda query: mock_cursor_watched if "anime_id" in query and "$in" in query["anime_id"] else None

    mock_cursor_candidates = AsyncMock()
    mock_cursor_candidates.to_list = AsyncMock(return_value=candidates_ml)
    
    # Update side_effect to handle both calls
    def find_side_effect(query):
        if "anime_id" in query:
            if "$in" in query["anime_id"]:
                return mock_cursor_watched
            if "$nin" in query["anime_id"]:
                return mock_cursor_candidates
        return AsyncMock()

    mock_db["animemls"].find.side_effect = find_side_effect
    
    recommender = RecommenderService(mock_db)
    recommendations = await recommender.get_recommendations("user_123")
    
    assert len(recommendations) > 0
    assert recommendations[0]["anime_id"] == 3
    assert "xai_reason" in recommendations[0]
    assert "Action" in recommendations[0]["xai_reason"] # Since all genres were 1.0
