
import asyncio
import random
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import AIDecision, Application, Job, Candidate, User, UserRole, Agency
from app.services.ai_decision_queue_service import DecisionType, DecisionStatus

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"
TEST_COMPANY_ID = "78e96a7c-be6c-4a64-86a9-294a24c2eca0"

NAMES = [
    "Alex Johnson", "Sarah Miller", "David Smith", "Elena Petrova",
    "Sizwe Khoza", "Lerato Mokoena", "John Smith", "Emma Wilson",
    "Thabo Molefe", "Priya Naidoo", "Robert Brown", "Maria Garcia",
    "Yuki Tanaka", "Ahmed Hassan", "Sophie Laurent", "Hans Schmidt",
    "Chiara Rossi", "Liam O'Connor", "Noah Williams", "Olivia Jones",
    "Ava Taylor", "Ethan Davis", "Sophia Martinez", "Mason Anderson"
]

TITLES = [
    "Senior DevOps Engineer", "Fullstack Developer", "Frontend Engineer", "UX Designer",
    "Backend Developer", "Product Manager", "Data Scientist", "Mobile App Developer",
    "Software Engineer", "Systems Architect", "QA Engineer", "Project Manager"
]

SKILLS_LIST = [
    "AWS, Docker, Kubernetes", "React, Node.js, PostgreSQL", "Vue.js, TypeScript, Tailwind", "Figma, Design Systems, User Research",
    "Python, Django, Redis", "Go, Microservices, gRPC", "Flutter, Firebase, Dart", "Java, Spring Boot, Oracle"
]

async def final_seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Starting CLEAN SEED for AI Decision Queue...")
        
        # 1. Clear existing decisions
        await session.execute(delete(AIDecision))
        
        # 2. Get the Agency ID (used for multi-tenancy)
        res = await session.execute(select(Agency))
        agency = res.scalars().first()
        if not agency:
            print("No agency found. Please run initial setup first.")
            return
        agency_id = agency.id
        
        # 3. Get the Test Company
        res = await session.execute(select(Job).where(Job.client_company_id == TEST_COMPANY_ID))
        existing_jobs = res.scalars().all()
        
        if not existing_jobs:
            print("No jobs found for test company. Creating jobs...")
            # Create a few jobs
            for i in range(3):
                job = Job(
                    id=uuid4(),
                    agency_id=agency_id,
                    client_company_id=TEST_COMPANY_ID,
                    title=random.choice(TITLES),
                    reference=f"JOB-SEED-{i}-{random.randint(1000, 9999)}",
                    description="Automated seed job description",
                    location="Sandton, Johannesburg",
                    category="IT",
                    status="active",
                    created_at=datetime.utcnow()
                )
                session.add(job)
            await session.commit()
            res = await session.execute(select(Job).where(Job.client_company_id == TEST_COMPANY_ID))
            existing_jobs = res.scalars().all()

        job_ids = [j.id for j in existing_jobs]
        
        # 4. Create 20 Candidates and Applications
        print(f"Creating 20 new applications and decisions for {len(job_ids)} jobs...")
        
        for i in range(20):
            # Create Candidate
            name = random.choice(NAMES)
            first_name, last_name = name.split(" ", 1)
            candidate = Candidate(
                id=uuid4(),
                agency_id=agency_id,
                first_name=first_name,
                last_name=last_name,
                email=f"seed.candidate.{i}.{uuid4().hex[:4]}@example.com",
                phone="+27123456789",
                created_at=datetime.utcnow()
            )
            session.add(candidate)
            await session.flush()
            
            # Create Application
            job_id = random.choice(job_ids)
            application = Application(
                id=uuid4(),
                agency_id=agency_id,
                job_id=job_id,
                candidate_id=candidate.id,
                client_company_id=TEST_COMPANY_ID,
                status="applied",
                created_at=datetime.utcnow()
            )
            session.add(application)
            await session.flush()
            
            # Create AIDecision
            dtype = random.choice([
                DecisionType.AUTO_REJECT,
                DecisionType.SEND_VIDEO_SCREENING,
                DecisionType.FAST_TRACK_INTERVIEW,
                DecisionType.SCHEDULE_INTERVIEW
            ])
            confidence = random.randint(85, 99)
            
            reasoning_map = {
                DecisionType.AUTO_REJECT: f"Candidate lacks {random.choice(['Cloud', 'Backend', 'Senior'])} experience. Automated screening score: {random.randint(40, 60)}%.",
                DecisionType.SEND_VIDEO_SCREENING: f"Strong technical match ({confidence}%). Soft skills verification recommended via video screening.",
                DecisionType.FAST_TRACK_INTERVIEW: f"Exceptional profile! Matches all critical skills and has relevant industry background.",
                DecisionType.SCHEDULE_INTERVIEW: f"Qualified candidate found via proactive sourcing. Recommendation: Proceed to first interview."
            }
            
            action = {
                "action": dtype.value,
                "candidate_name": f"{first_name} {last_name}",
                "reason": reasoning_map[dtype],
                "score": confidence,
                "details": {
                    "skills": random.choice(SKILLS_LIST),
                    "location": "Johannesburg, SA",
                    "match_analysis": "Verified by RecruitPro AI"
                }
            }
            
            decision = AIDecision(
                id=uuid4(),
                job_id=job_id,
                application_id=application.id,
                candidate_id=candidate.id,
                decision_type=dtype,
                status=DecisionStatus.PENDING,
                ai_reasoning=reasoning_map[dtype],
                ai_confidence=confidence,
                proposed_action=action,
                created_by_service="final_seed_worker",
                created_at=datetime.utcnow() - timedelta(minutes=random.randint(1, 120))
            )
            session.add(decision)
            
        await session.commit()
        print("✅ SUCCESS: Seeded 20 pending AI decisions linked to the test company.")

if __name__ == "__main__":
    asyncio.run(final_seed())
