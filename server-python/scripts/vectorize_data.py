import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.anime import AnimeCache, AnimeML
from app.services.vectorizer import VectorizerService

async def vectorize_data():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    print("Starting vectorization process...")
    
    # 1. Fetch all anime from cache
    cursor = db["animecaches"].find({})
    anime_list = await cursor.to_list(length=2000) # Get up to 2000
    
    print(f"Found {len(anime_list)} anime documents.")
    
    if not anime_list:
        print("No documents found to vectorize. Ensure the Node.js seeder has run.")
        client.close()
        return

    ml_docs = []
    for doc in anime_list:
        try:
            # Map _id to id for Pydantic
            anime_cache = AnimeCache(**doc)
            vector = VectorizerService.vectorize(anime_cache)
            
            ml_doc = {
                "anime_id": anime_cache.id,
                "title": anime_cache.title.english or anime_cache.title.romaji or "Unknown",
                "feature_vector": vector,
                "embedding": [0.0, 0.0] # Placeholder for future dimensionality reduction (t-SNE/UMAP)
            }
            ml_docs.append(ml_doc)
        except Exception as e:
            print(f"Error processing anime {doc.get('_id')}: {e}")

    # 2. Bulk upsert into animemls
    if ml_docs:
        from pymongo import UpdateOne
        operations = [
            UpdateOne({"anime_id": doc["anime_id"]}, {"$set": doc}, upsert=True)
            for doc in ml_docs
        ]
        result = await db["animemls"].bulk_write(operations)
        print(f"Successfully processed {result.upserted_count + result.modified_count} vectors into 'animemls'.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(vectorize_data())
