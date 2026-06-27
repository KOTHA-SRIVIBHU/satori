from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    response = client.get("/anime-dna/")
    print(response.status_code)
    if response.status_code == 500:
        print(response.json())
