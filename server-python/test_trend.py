import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.services.trend_predictor import TrendPredictorService

async def main():
    c = AsyncIOMotorClient(settings.MONGODB_URI)
    d = c[settings.DATABASE_NAME]
    service = TrendPredictorService(d)
    
    res = await service.get_seasonal_predictions(2023)
    import pprint
    pprint.pprint(res[:2])

asyncio.run(main())
