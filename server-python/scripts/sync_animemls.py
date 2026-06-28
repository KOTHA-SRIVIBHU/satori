import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vectorizer import VectorizerService
from dotenv import load_dotenv

load_dotenv()

async def main():
    uri = os.environ.get("MONGODB_URI")
    if not uri:
        print("Missing MONGODB_URI")
        return
        
    client = AsyncIOMotorClient(uri)
    db = client["satori"]
    
    print("Reading AnimeCache...")
    caches = await db["animecaches"].find({}).to_list(None)
    print(f"Found {len(caches)} total entries in AnimeCache.")
    
    unique_caches = {}
    for c in caches:
        unique_caches[c["_id"]] = c
        
    print(f"Found {len(unique_caches)} UNIQUE entries after deduplication.")
    
    print("Vectorizing and upserting to animemls...")
    
    # We will clear animemls and rebuild it to ensure no orphans
    await db["animemls"].delete_many({})
    
    bulk_ops = []
    
    class MockAnime:
        def __init__(self, data):
            self.tags = []
            for t in data.get("tags", []):
                class Tag:
                    pass
                tag = Tag()
                tag.name = t.get("name")
                tag.rank = t.get("rank")
                self.tags.append(tag)
            self.averageScore = data.get("averageScore")
            self.popularity = data.get("popularity")
            self.genres = data.get("genres", [])
            
    for anime_id, data in unique_caches.items():
        mock_anime = MockAnime(data)
        vector = VectorizerService.vectorize(mock_anime)
        
        doc = {
            "anime_id": anime_id,
            "title": data.get("title"),
            "genres": data.get("genres", []),
            "feature_vector": vector,
            "studios": data.get("studios", [])
        }
        bulk_ops.append(doc)
        
    if bulk_ops:
        await db["animemls"].insert_many(bulk_ops)
        print(f"Successfully inserted {len(bulk_ops)} Neural Nodes into animemls!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
