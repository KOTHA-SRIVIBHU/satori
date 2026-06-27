import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def main():
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    d = c[settings.DATABASE_NAME]
    doc = await d["animecaches"].find_one()
    import pprint
    pprint.pprint(doc)

asyncio.run(main())
