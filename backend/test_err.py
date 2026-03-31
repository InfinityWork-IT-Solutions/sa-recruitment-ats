import asyncio
import sys

from app.core.database import SessionLocal
from app.services.auth_service import AuthService
from app.schemas.auth import CandidateRegisterRequest
from app.schemas.candidate import CandidateCreate
from app.schemas.user import UserCreate

async def main():
    async with SessionLocal() as db:
        user_data = UserCreate(
            email="test_err_candidate1@example.com",
            password="SecurePassword123",
            first_name="Test",
            last_name="Candidate",
            phone="1234567890",
            role="candidate"
        )
        
        candidate_data = CandidateCreate(
            years_of_experience=0,
            consent_to_contact=True,
            first_name="Test",
            last_name="Candidate",
            email="test_err_candidate1@example.com",
            phone="1234567890",
            city="Cape Town",
            province="Western Cape"
        )
        
        try:
            cand, user = await AuthService.register_candidate(db, candidate_data, user_data)
            print("Successfully registered!")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
