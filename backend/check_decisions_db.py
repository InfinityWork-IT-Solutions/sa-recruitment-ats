
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import AIDecision, Job

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"

async def check_decisions():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        res = await session.execute(select(AIDecision, Job).join(Job))
        rows = res.all()
        print(f"Decisions with Jobs in DB: {len(rows)}")
        for d, j in rows:
            print(f"Decision: {d.id}, Job: {j.id}, JobCompany: {j.client_company_id}")

if __name__ == "__main__":
    asyncio.run(check_decisions())
