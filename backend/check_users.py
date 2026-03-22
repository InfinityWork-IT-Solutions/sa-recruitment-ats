
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.email}, Active: {u.is_active}")
        if not hasattr(result, "scalars") and not users:
             print("No users found.")

asyncio.run(main())

