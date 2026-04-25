
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import User, ClientCompany

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"

async def check_user():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        res = await session.execute(select(User).where(User.email == 'mpumelelo@infinityworkitsolutions.com'))
        u = res.scalars().first()
        if not u:
            print("User not found.")
            return
            
        print(f"User: {u.email}, Role: {u.role}")
        
        # Check if they are a client contact
        res = await session.execute(select(ClientCompany).where(ClientCompany.user_id == u.id))
        cc = res.scalars().first()
        if cc:
            print(f"Company: {cc.name}, ID: {cc.id}")
        else:
            print("No linked ClientCompany found.")

if __name__ == "__main__":
    asyncio.run(check_user())
