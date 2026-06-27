import asyncio
from app.api.endpoints.visualizer import get_anime_dna
from app.db.mongodb import client, db

async def test():
    class DummyDB:
        def __getitem__(self, key):
            return db[key]
    
    try:
        res = await get_anime_dna(db)
        print("Success:", len(res))
    except Exception as e:
        print("Error:", repr(e))

asyncio.run(test())
