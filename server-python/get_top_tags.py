import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from collections import Counter

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    cursor = db["animecaches"].find({})
    anime_list = await cursor.to_list(length=2000)
    
    tag_counts = Counter()
    for doc in anime_list:
        tags = doc.get("tags", [])
        for t in tags:
            tag_counts[t["name"]] += 1
            
    top_tags = [t[0] for t in tag_counts.most_common(300)]
    print(len(top_tags))
    print(top_tags)
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
