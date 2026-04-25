
import asyncio
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import AutomatedScreeningResult, AIDecision, Application, Job
from app.services.ai_decision_queue_service import DecisionType, DecisionStatus

# Use correct DB URL from .env
DATABASE_URL = "postgresql+asyncpg://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa"

async def migrate_data():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Scanning for existing screening results to create AI Decisions...")
        
        # 1. Get all AutomatedScreeningResult
        result = await session.execute(select(AutomatedScreeningResult))
        screening_results = result.scalars().all()
        
        print(f"Found {len(screening_results)} screening results.")
        
        migrated_count = 0
        
        for sr in screening_results:
            # Check if a decision already exists for this application
            existing = await session.execute(
                select(AIDecision).where(AIDecision.application_id == sr.application_id)
            )
            if existing.scalars().first():
                continue
                
            # Determine decision type based on screening result
            decision_type = DecisionType.AUTO_REJECT
            confidence = sr.overall_score or 70
            
            if sr.decision == "fast_track":
                decision_type = DecisionType.FAST_TRACK_INTERVIEW
            elif sr.decision == "video_screening":
                decision_type = DecisionType.SEND_VIDEO_SCREENING
            elif sr.decision == "shortlist":
                decision_type = DecisionType.SCHEDULE_INTERVIEW
            
            # Create proposed action
            proposed_action = {
                "action": sr.decision,
                "reason": sr.decision_reason or sr.ai_summary or "Based on AI screening match score",
                "score": sr.overall_score,
                "details": {
                    "skills": sr.skills_score,
                    "experience": sr.experience_score
                }
            }
            
            new_decision = AIDecision(
                job_id=sr.job_id,
                application_id=sr.application_id,
                candidate_id=sr.candidate_id,
                decision_type=decision_type,
                status=DecisionStatus.PENDING,
                ai_reasoning=sr.ai_summary or f"AI Match Score: {sr.overall_score}%",
                ai_confidence=confidence,
                proposed_action=proposed_action,
                created_by_service="automated_screening_migration",
                created_at=datetime.utcnow()
            )
            
            session.add(new_decision)
            migrated_count += 1
            
        await session.commit()
        print(f"Migration complete! Created {migrated_count} new PENDING AI decisions.")

if __name__ == "__main__":
    asyncio.run(migrate_data())
