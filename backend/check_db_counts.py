
import asyncio
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import AutomatedScreeningResult, AIDecision, Job, Candidate, Application

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/recruitpro_ats"

async def check_counts():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check screening results
        res = await session.execute(select(func.count()).select_from(AutomatedScreeningResult))
        screening_count = res.scalar()
        
        # Check AI decisions
        res = await session.execute(select(func.count()).select_from(AIDecision))
        decision_count = res.scalar()
        
        # Check jobs and applications
        res = await session.execute(select(func.count()).select_from(Job))
        job_count = res.scalar()
        
        print(f"AutomatedScreeningResult: {screening_count}")
        print(f"AIDecision: {decision_count}")
        print(f"Jobs: {job_count}")

if __name__ == "__main__":
    asyncio.run(check_counts())
