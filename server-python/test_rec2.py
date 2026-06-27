import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.services.recommender import RecommenderService

async def main():
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    d = c[settings.DATABASE_NAME]
    rs = RecommenderService(d)
    
    user = await d["users"].find_one({"animeList": {"$ne": []}})
    if not user:
        print("No user found")
        return
    print("Testing for user:", user["_id"])
    try:
        recs = await rs.get_recommendations(str(user["_id"]))
        print("Success, recs:", len(recs))
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
