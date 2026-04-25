
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import AIDecision

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"

async def debug_status():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        res = await session.execute(select(AIDecision))
        for d in res.scalars():
            print(f"ID: {d.id}, Status: |{d.status}|, Type: {type(d.status)}")

if __name__ == "__main__":
    asyncio.run(debug_status())
