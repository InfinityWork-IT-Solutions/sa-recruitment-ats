import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

EMAILS_TO_DELETE = [
    "mpumelelo@infinityworkitsolutions.com"
]

async def delete_users():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        for email in EMAILS_TO_DELETE:
            print(f"Searching for user: {email}...")
            
            # 1. Get User ID
            result = await session.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            user = result.fetchone()
            
            if not user:
                print(f"User {email} not found.")
                continue
            
            user_id = user[0]
            print(f"Found User ID: {user_id}")
            
            # 2. Delete related ClientCompany (if any)
            # Find client company by user_id
            await session.execute(text("DELETE FROM client_companies WHERE user_id = :user_id"), {"user_id": user_id})
            print(f"Deleted associated client companies for {user_id}")
            
            # 3. Delete related Candidate (if any)
            await session.execute(text("DELETE FROM candidates WHERE user_id = :user_id"), {"user_id": user_id})
            print(f"Deleted associated candidates for {user_id}")
            
            # 4. Delete Profile Views
            await session.execute(text("DELETE FROM profile_views WHERE profile_user_id = :user_id OR viewer_user_id = :user_id"), {"user_id": user_id})
            
            # 5. Delete Activities
            await session.execute(text("DELETE FROM activities WHERE user_id = :user_id"), {"user_id": user_id})

            # 6. Delete User
            await session.execute(text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})
            print(f"Successfully deleted user: {email}")
            
        await session.commit()
    
    await engine.dispose()
    print("\nCleanup complete!")

if __name__ == "__main__":
    asyncio.run(delete_users())
