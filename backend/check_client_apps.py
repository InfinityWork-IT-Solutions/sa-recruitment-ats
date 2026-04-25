
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import User, UserRole, Application, Job

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"

async def check_client_apps():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find a client user
        res = await session.execute(select(User).where(User.role == UserRole.CLIENT))
        client = res.scalars().first()
        
        if not client:
            print("No client user found.")
            return
            
        print(f"Found client user: {client.email}, Company ID: {client.company_id}")
        
        # Find applications for this company
        res = await session.execute(
            select(Application).join(Job).where(Job.company_id == client.company_id)
        )
        apps = res.scalars().all()
        print(f"Found {len(apps)} applications for this company.")

if __name__ == "__main__":
    asyncio.run(check_client_apps())
