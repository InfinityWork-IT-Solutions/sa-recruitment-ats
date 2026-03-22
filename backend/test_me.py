
import asyncio
from app.core.database import AsyncSessionLocal
from app.services.auth_service import auth_service

async def test_me():
    async with AsyncSessionLocal() as db:
        user = await auth_service.authenticate_user(db, "test@user.com", "Password123!")
        if user:
            tokens = auth_service.create_tokens(user)
            print("Access Token:", tokens["access_token"])
        else:
            print("Auth failed")

asyncio.run(test_me())

