import pytest
from app.db.mongodb import get_database, connect_to_mongo, close_mongo_connection

@pytest.mark.anyio
async def test_fetch_anime_cache():
    await connect_to_mongo()
    db = await get_database()
    collection = db["users"] 
    
    # Try to find one document
    doc = await collection.find_one()
    
    await close_mongo_connection()
    
    assert doc is not None
    assert "email" in doc or "username" in doc
