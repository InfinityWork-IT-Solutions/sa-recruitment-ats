import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.application import Application
from app.models.automation import VideoScreeningInvitation, VideoScreeningTemplate

async def create_test_invitation():
    session = AsyncSessionLocal()
    try:
        # 1. Get a candidate
        candidate_stmt = select(Candidate).limit(1)
        candidate_result = await session.execute(candidate_stmt)
        candidate = candidate_result.scalar_one_or_none()
        
        if not candidate:
            print("No candidates found.")
            return

        # 2. Get a job
        job_stmt = select(Job).limit(1)
        job_result = await session.execute(job_stmt)
        job = job_result.scalar_one_or_none()
        
        if not job:
            print("No jobs found.")
            return

        # 3. Get or Create an Application
        app_stmt = select(Application).where(Application.candidate_id == candidate.id, Application.job_id == job.id).limit(1)
        app_result = await session.execute(app_stmt)
        application = app_result.scalar_one_or_none()
        
        if not application:
            application = Application(
                candidate_id=candidate.id,
                job_id=job.id,
                status="screening"
            )
            session.add(application)
            await session.flush()

        # 4. Create a Template
        template = VideoScreeningTemplate(
            company_id=job.client_company_id,
            job_id=job.id,
            name="Test Screening Template",
            description="A template for testing the video screening system.",
            questions=[
                {"text": "Tell us about your experience with React and FastAPI.", "duration": 60},
                {"text": "What is the most challenging project you've worked on?", "duration": 90},
                {"text": "Why do you want to work at RecruitPro SA?", "duration": 60}
            ]
        )
        session.add(template)
        await session.flush()

        # 5. Create the Invitation
        token = str(uuid.uuid4())[:18].replace("-", "")
        invitation = VideoScreeningInvitation(
            application_id=application.id,
            candidate_id=candidate.id,
            job_id=job.id,
            template_id=template.id,
            access_token=token,
            expires_at=datetime.utcnow() + timedelta(days=7),
            status="pending",
            invitation_sent_at=datetime.utcnow(),
            invitation_email_sent=True
        )
        session.add(invitation)
        await session.commit()
        
        print(f"SUCCESS: Test invitation created!")
        print(f"CANDIDATE: {candidate.first_name} {candidate.last_name} ({candidate.email})")
        print(f"JOB: {job.title}")
        print(f"ACCESS TOKEN: {token}")
        print(f"TEST URL: http://localhost:5173/video-screening/{token}")

    except Exception as e:
        print(f"ERROR: {e}")
        await session.rollback()
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(create_test_invitation())
