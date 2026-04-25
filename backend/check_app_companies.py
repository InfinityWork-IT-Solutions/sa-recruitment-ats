
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import Application, Job

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"

async def check_app_companies():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        res = await session.execute(select(Application, Job).join(Job))
        rows = res.all()
        print(f"Total Applications with Jobs: {len(rows)}")
        for app, job in rows:
            print(f"App: {app.id}, Job: {job.id}, Company: {job.client_company_id}")

if __name__ == "__main__":
    asyncio.run(check_app_companies())
