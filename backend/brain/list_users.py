import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def list_users():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT email, role, first_name, last_name FROM users"))
        users = result.fetchall()
        print("\n=== Current Users in Database ===")
        for user in users:
            print(f"- {user.email} ({user.role}) - {user.first_name} {user.last_name}")
        print("==================================\n")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_users())
