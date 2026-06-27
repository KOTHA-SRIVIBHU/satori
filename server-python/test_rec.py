from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    response = client.post("/recommend/", json={"user_id": "test", "limit": 5})
    print(response.status_code)
    if response.status_code == 500:
        print(response.json())
