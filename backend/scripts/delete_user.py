"""
RecruitPro SA - User Deletion Script
Use this to delete a user and related profile data (Candidate/ClientCompany) so they can register again.
Usage: python scripts/delete_user.py <email>
"""
import sys
import os
import asyncio
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.candidate import Candidate
from app.models.client_company import ClientCompany
from app.models.agency import Agency

async def delete_user(email: str):
    """Delete user and related data from the database"""
    print(f"Searching for user with email: {email}...")
    
    async with AsyncSessionLocal() as db:
        # 1. Find the user
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"ERROR: User with email '{email}' not found.")
            return False
            
        user_id = user.id
        agency_id = user.agency_id
        
        print(f"Found User: {user.full_name} (ID: {user_id}, Role: {user.role.value})")
        
        # 2. Check for Candidate profile
        result = await db.execute(select(Candidate).filter(Candidate.user_id == user_id))
        candidate = result.scalars().first()
        if candidate:
            print(f"Found related Candidate profile (ID: {candidate.id}). Deleting...")
            await db.execute(delete(Candidate).where(Candidate.id == candidate.id))
            
        # 3. Check for ClientCompany profile
        result = await db.execute(select(ClientCompany).filter(ClientCompany.user_id == user_id))
        company = result.scalars().first()
        if company:
            print(f"Found related ClientCompany profile (ID: {company.id}). Deleting...")
            # Note: Jobs and Applications might be linked to the company. 
            # If they exist, this might fail unless they also cascade.
            # ClientCompany model has: applications = relationship(..., cascade="all, delete-orphan")
            # But let's check Jobs.
            await db.execute(delete(ClientCompany).where(ClientCompany.id == company.id))
            
        # 4. Delete the User
        print(f"Deleting User record...")
        await db.execute(delete(User).where(User.id == user_id))
        
        # 5. Optional: If this was the ONLY user for an agency (and not the system agency), 
        # the user might want to delete the agency too to register again as a recruiter.
        # But we'll leave agencies alone for now unless they are explicitly problematic.
        
        await db.commit()
        print(f"SUCCESS: User {email} and related profile data have been deleted.")
        print("You can now register again with this email.")
        return True

if __name__ == "__main__":
    # Get email from command line or prompt
    if len(sys.argv) > 1:
        target_email = sys.argv[1]
    else:
        target_email = input("Enter user email to delete: ").strip()
    
    if target_email:
        # Confirm deletion
        confirm = input(f"Are you sure you want to delete {target_email}? (y/n): ").lower()
        if confirm == 'y':
            asyncio.run(delete_user(target_email))
        else:
            print("Deletion cancelled.")
    else:
        print("❌ Error: No email provided.")
