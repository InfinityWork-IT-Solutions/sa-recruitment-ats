"""
RecruitPro SA - User Authority Elevation Script
Use this to promote any user to 'super_admin' role.
Usage: python scripts/promote_user.py <email>
"""
import sys
import os
import asyncio
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole

async def promote_user(email: str):
    """Elevate user role in the database"""
    print(f"Searching for ID: {email}...")
    
    async with AsyncSessionLocal() as db:
        # Check if user exists
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"ERROR: User with email '{email}' not found in the system.")
            return False
        
        if user.role == UserRole.super_admin:
            print(f"NOTICE: User {email} is ALREADY a Super Admin.")
            return True
        
        print(f"ELEVATING {user.full_name} from {user.role.value} to SUPER_ADMIN Authority...")
        
        # Perform elevation
        stmt = update(User).where(User.email == email).values(role=UserRole.super_admin)
        await db.execute(stmt)
        await db.commit()
        
        print(f"SUCCESS: {email} is now a System Super Admin.")
        print("Tip: Refresh your browser and log back in to access the Admin Console.")
        return True

if __name__ == "__main__":
    # Get email from command line or prompt
    if len(sys.argv) > 1:
        target_email = sys.argv[1]
    else:
        target_email = input("Enter user email to promote: ").strip()
    
    if target_email:
        asyncio.run(promote_user(target_email))
    else:
        print("❌ Error: No email provided.")
