import asyncio
import uuid
from datetime import datetime, timedelta
from app.core.database import AsyncSessionLocal
from app.models import Job, Agency, User, UserRole, JobStatus
from app.core.security import hash_password

async def seed_public_jobs():
    async with AsyncSessionLocal() as db:
        # 1. Get or create system agency
        from app.services.auth_service import AuthService
        agency = await AuthService.get_or_create_system_agency(db)
        
        # 2. Get or create a system user (to be creator of the jobs)
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "system@recruitpro.co.za"))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                email="system@recruitpro.co.za",
                first_name="System",
                last_name="Admin",
                role=UserRole.super_admin,
                hashed_password=hash_password("SystemPass123!"),
                is_active=True,
                is_verified=True,
                agency_id=agency.id
            )
            db.add(user)
            await db.flush()
        
        # 3. Create some sample jobs
        sample_jobs = [
            {
                "title": "Senior React Developer",
                "category": "it",
                "location": "Cape Town",
                "description": "We are looking for a Senior React Developer to join our dynamic team. You will be responsible for building high-quality web applications.",
                "employment_type": "full_time",
                "experience_level": "senior_level",
                "salary_min": 70000,
                "salary_max": 95000,
                "show_salary": True,
                "requirements": ["5+ years of React experience", "Strong TypeScript skills", "Experience with Tailwind CSS"],
                "responsibilities": ["Lead frontend development", "Mentor junior developers", "Code reviews"],
                "positions_available": 2
            },
            {
                "title": "Marketing Manager",
                "category": "marketing",
                "location": "Johannesburg",
                "description": "Join our marketing team to lead brand strategy and digital campaigns. We need a creative thinker with a data-driven approach.",
                "employment_type": "full_time",
                "experience_level": "mid_level",
                "salary_min": 45000,
                "salary_max": 60000,
                "show_salary": True,
                "requirements": ["Proven marketing experience", "Project management skills", "Familiarity with SEO/SEM"],
                "responsibilities": ["Plan marketing campaigns", "Manage social media", "Analyze campaign performance"],
                "positions_available": 1
            },
            {
                "title": "Cloud Architect",
                "category": "it",
                "location": "Remote",
                "description": "Design and implement scalable cloud infrastructures. Work with AWS, Azure, and GCP to provide the best solutions for our clients.",
                "employment_type": "contract",
                "experience_level": "senior_level",
                "is_remote": True,
                "salary_min": 100000,
                "show_salary": True,
                "requirements": ["Cloud certification", "Experience with IaC (Terraform)", "Architecture design patterns"],
                "responsibilities": ["Cloud migration strategy", "Infrastructure optimization", "Security audits"],
                "positions_available": 1
            }
        ]
        
        for job_data in sample_jobs:
            job = Job(
                id=uuid.uuid4(),
                agency_id=agency.id,
                created_by=user.id,
                reference=f"SEED-{uuid.uuid4().hex[:6].upper()}",
                status=JobStatus.active,
                published_at=datetime.utcnow(),
                closing_date=datetime.utcnow() + timedelta(days=30),
                **job_data
            )
            db.add(job)
        
        await db.commit()
        print(f"Seed complete: Added {len(sample_jobs)} sample jobs.")

if __name__ == "__main__":
    import os
    import sys
    # Add current dir to path
    sys.path.append(os.getcwd())
    
    # Load env vars
    from dotenv import load_dotenv
    load_dotenv('.env')
    
    asyncio.run(seed_public_jobs())
