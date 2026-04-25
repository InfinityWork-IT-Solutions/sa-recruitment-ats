
import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import Job, ClientCompany

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"
TEST_COMPANY_ID = "78e96a7c-be6c-4a64-86a9-294a24c2eca0"

async def link_jobs():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print(f"Linking all jobs to test company {TEST_COMPANY_ID}...")
        await session.execute(
            update(Job).values(client_company_id=TEST_COMPANY_ID)
        )
        await session.commit()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(link_jobs())
