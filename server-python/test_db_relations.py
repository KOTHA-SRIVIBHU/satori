import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def main():
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    d = c[settings.DATABASE_NAME]
    doc = await d["animecaches"].find_one({"_id": 101922})
    import pprint
    pprint.pprint(doc.get("relations"))

asyncio.run(main())
