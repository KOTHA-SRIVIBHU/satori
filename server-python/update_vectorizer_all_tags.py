import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    cursor = db["animecaches"].find({})
    anime_list = await cursor.to_list(length=2000)
    
    unique_tags = set()
    for doc in anime_list:
        tags = doc.get("tags", [])
        for t in tags:
            unique_tags.add(t["name"])
            
    all_tags = list(unique_tags)
    
    with open('app/services/vectorizer.py', 'w') as f:
        f.write("import asyncio\n")
        f.write("from motor.motor_asyncio import AsyncIOMotorClient\n")
        f.write("from app.core.config import settings\n\n")
        f.write(f"ALL_TAGS = {all_tags}\n\n")
        f.write("class VectorizerService:\n")
        f.write("    @staticmethod\n")
        f.write("    def vectorize(anime):\n")
        f.write("        tag_dict = {tag.name: tag.rank for tag in anime.tags}\n")
        f.write("        # Square the weight to heavily emphasize primary/defining tags (90%+) over minor tags (40%)\n")
        f.write("        tag_vector = [(tag_dict.get(t, 0.0) / 100.0) ** 2 for t in ALL_TAGS]\n")
        f.write("        \n")
        f.write("        score_norm = (anime.averageScore or 0) / 100.0\n")
        f.write("        pop_norm = min((anime.popularity or 0) / 1000000.0, 1.0)\n")
        f.write("        \n")
        f.write("        # Drop genres completely as requested, rely only on squared tag weights\n")
        f.write("        vector = tag_vector + [score_norm, pop_norm]\n")
        f.write("        return vector\n")
        
    print(f"Updated vectorizer with {len(all_tags)} unique tags.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
