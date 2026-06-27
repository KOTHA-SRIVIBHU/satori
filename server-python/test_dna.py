import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.services.dna_finder import DNAFinderService

async def main():
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    d = c[settings.DATABASE_NAME]
    service = DNAFinderService(d)
    
    user = await d["users"].find_one({"animeList": {"$ne": []}})
    if not user:
        print("No user found")
        return
    print("Testing for user:", user["_id"])
    try:
        res = await service.analyze_user_dna(str(user["_id"]))
        print("Result:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
