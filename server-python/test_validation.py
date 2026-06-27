import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.api.endpoints.visualizer import AnimeDNA
from app.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    pipeline = [
        {"$lookup": {"from": "animecaches", "localField": "anime_id", "foreignField": "_id", "as": "raw_data"}},
        {"$unwind": "$raw_data"},
        {"$project": {
            "id": "$anime_id",
            "title": 1,
            "x": {"$arrayElemAt": ["$embedding", 0]},
            "y": {"$arrayElemAt": ["$embedding", 1]},
            "genres": "$raw_data.genres",
            "tags": "$raw_data.tags"
        }}
    ]
    cursor = db["animemls"].aggregate(pipeline)
    docs = await cursor.to_list(length=2000)
    for doc in docs:
        try:
            AnimeDNA(**doc)
        except Exception as e:
            print("Validation error on doc:", doc.get('id'), repr(e))
    print("Done testing", len(docs), "documents")

asyncio.run(main())
