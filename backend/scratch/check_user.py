import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def check():
    import logging
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == 'mpumelelomagagula03@gmail.com'))
        user = res.scalar_one_or_none()
        if user:
            print(f"User: {user.email}")
            print(f"Role: {user.role}")
            # Check candidate relationship
            from sqlalchemy.orm import selectinload
            res = await db.execute(
                select(User)
                .options(selectinload(User.candidate))
                .where(User.email == 'mpumelelomagagula03@gmail.com')
            )
            user = res.scalar_one()
            print(f"Has Candidate Record: {user.candidate is not None}")
            if user.candidate:
                print(f"Candidate ID: {user.candidate.id}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check())
