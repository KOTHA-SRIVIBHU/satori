from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.endpoints import recommendation, visualizer, dna, trend

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await connect_to_mongo()
    yield
    # Shutdown logic
    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)

app.include_router(recommendation.router, prefix="/recommend", tags=["recommendation"])
app.include_router(visualizer.router, prefix="/anime-dna", tags=["visualization"])
app.include_router(dna.router, prefix="/dna", tags=["dna-finder"])
app.include_router(trend.router, prefix="/trend", tags=["trend-predictor"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
