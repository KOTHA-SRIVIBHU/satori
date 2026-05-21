from fastapi.testclient import TestClient
from app.main import app

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

def test_recommend_endpoint_unauthorized():
    with TestClient(app) as client:
        response = client.post("/recommend/", json={"user_id": "nonexistent", "limit": 5})
        assert response.status_code == 200
        assert isinstance(response.json(), list)

def test_anime_dna_endpoint():
    with TestClient(app) as client:
        response = client.get("/anime-dna/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "x" in data[0]
            assert "y" in data[0]
            assert "genres" in data[0]
