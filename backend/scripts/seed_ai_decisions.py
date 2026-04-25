
import asyncio
import random
from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import AIDecision, Application, Job, Candidate
from app.services.ai_decision_queue_service import DecisionType, DecisionStatus

DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"

async def seed_decisions():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get all applications
        result = await session.execute(select(Application))
        applications = result.scalars().all()
        
        if not applications:
            print("No applications found to seed decisions for.")
            return

        print(f"Found {len(applications)} applications. Seeding AI decisions...")
        
        seed_count = 0
        decision_types = [
            DecisionType.AUTO_REJECT,
            DecisionType.SEND_VIDEO_SCREENING,
            DecisionType.FAST_TRACK_INTERVIEW,
            DecisionType.SCHEDULE_INTERVIEW
        ]
        
        for app in applications:
            # Check if decision exists
            existing = await session.execute(
                select(AIDecision).where(AIDecision.application_id == app.id)
            )
            if existing.scalars().first():
                continue
            
            # Fetch candidate for name
            candidate = await session.get(Candidate, app.candidate_id)
            candidate_name = candidate.full_name if candidate else f"Applicant {app.id.hex[:4]}"
            
            dtype = random.choice(decision_types)
            confidence = random.randint(75, 98)
            
            reasoning_map = {
                DecisionType.AUTO_REJECT: "Matches less than 60% of required skills. Missing key experience in Cloud Architecture.",
                DecisionType.SEND_VIDEO_SCREENING: "Strong technical background but communication skills need verification. Match score 82%.",
                DecisionType.FAST_TRACK_INTERVIEW: "Exceptional match! 95% skill overlap and relevant industry experience. Highly recommended.",
                DecisionType.SCHEDULE_INTERVIEW: "Solid candidate. Meets all basic requirements and has 5 years of relevant experience."
            }
            reasoning = reasoning_map[dtype]
            
            action = {
                "action": dtype.value,
                "candidate_name": candidate_name,
                "reason": reasoning,
                "score": confidence,
                "details": {
                    "match_score": confidence,
                    "skills_match": random.randint(60, 100),
                    "experience_match": random.randint(60, 100)
                }
            }
            
            decision = AIDecision(
                job_id=app.job_id,
                application_id=app.id,
                candidate_id=app.candidate_id,
                decision_type=dtype,
                status=DecisionStatus.PENDING,
                ai_reasoning=reasoning,
                ai_confidence=confidence,
                proposed_action=action,
                created_by_service="seed_script",
                created_at=datetime.utcnow()
            )
            session.add(decision)
            seed_count += 1
            
        await session.commit()
        print(f"Successfully seeded {seed_count} AI Decisions.")

if __name__ == "__main__":
    asyncio.run(seed_decisions())
