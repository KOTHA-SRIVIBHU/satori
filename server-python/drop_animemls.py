import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    # Drop the collection to ensure no old 71-dim vectors remain
    await db["animemls"].drop()
    print("Dropped animemls collection.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
