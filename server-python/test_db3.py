import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def main():
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    d = c[settings.DATABASE_NAME]
    cols = await d.list_collection_names()
    print("Collections:", cols)
    
    if "anime" in cols:
        doc = await d["anime"].find_one()
        import pprint
        pprint.pprint(doc)

asyncio.run(main())
