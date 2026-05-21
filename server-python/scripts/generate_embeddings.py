import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.services.visualizer import VisualizerService

async def generate_embeddings():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    print("Fetching vectors from 'animemls'...")
    cursor = db["animemls"].find({})
    docs = await cursor.to_list(length=5000)
    
    if not docs:
        print("No documents found in 'animemls'. Run vectorize_data.py first.")
        client.close()
        return
        
    vectors = [doc["feature_vector"] for doc in docs]
    ids = [doc["_id"] for doc in docs]
    
    print(f"Running UMAP on {len(vectors)} vectors...")
    coordinates = VisualizerService.project_to_2d(vectors)
    
    print("Updating database with 2D coordinates...")
    from pymongo import UpdateOne
    operations = []
    for i, doc_id in enumerate(ids):
        operations.append(
            UpdateOne(
                {"_id": doc_id},
                {"$set": {"embedding": [float(coordinates[i, 0]), float(coordinates[i, 1])]}}
            )
        )
        
    if operations:
        result = await db["animemls"].bulk_write(operations)
        print(f"Successfully updated {result.modified_count} documents with 2D embeddings.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(generate_embeddings())
