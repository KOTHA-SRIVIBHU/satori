import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.services.dna_finder import DNAFinderService
import numpy as np
from app.services.vectorizer import ALL_TAGS

async def main():
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    d = c[settings.DATABASE_NAME]
    service = DNAFinderService(d)
    
    await service._train_model()
    model = service._kmeans_model
    
    tags = ALL_TAGS + ["Score", "Popularity"]
    
    for i, center in enumerate(model.cluster_centers_):
        top_indices = np.argsort(center)[-10:][::-1]
        top_tags = [tags[idx] for idx in top_indices]
        print(f"Cluster {i}: {', '.join(top_tags)}")
        
asyncio.run(main())
