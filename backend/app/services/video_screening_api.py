"""
============================================================================
VIDEO SCREENING API - CANDIDATE ENDPOINTS
============================================================================

PURPOSE:
FastAPI endpoints for candidate video screening flow.
Connects frontend React components to backend services.

ENDPOINTS:
1. GET  /api/video-screening/{access_token}/info - Get screening details
2. GET  /api/video-screening/{access_token}/questions - Get questions list
3. POST /api/video-screening/{access_token}/submit-response - Upload video
4. POST /api/video-screening/{access_token}/complete - Mark screening done
5. GET  /api/video-screening/{access_token}/completion-info - Get thank you page data

FRONTEND COMPONENTS USING THESE:
- VideoScreeningLanding.tsx (endpoint 1)
- VideoRecordingPage.tsx (endpoints 2, 3, 4)
- VideoScreeningComplete.tsx (endpoint 5)

HOW IT WORKS:
1. Candidate clicks email link with access_token
2. Frontend calls these endpoints to get data
3. Candidate records videos
4. Frontend uploads videos via endpoint 3
5. Backend stores videos, triggers AI analysis
6. Candidate sees success page

BACKEND SERVICES USED:
- VideoScreeningService (video_screening_service.py)
- EmailService (email_service.py)

VIDEO STORAGE:
- Option 1: AWS S3 (recommended for production)
- Option 2: Local filesystem (for development)

============================================================================
"""

import os
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

# Import your database and services
from database import get_db
from video_screening_service import VideoScreeningService
from email_service import EmailService

# Import models
from models import (
    VideoScreeningInvitation, 
    VideoScreeningTemplate,
    VideoScreeningResponse,
    Candidate,
    Job
)

router = APIRouter(prefix="/api/video-screening", tags=["Video Screening - Candidate"])

# ============================================================================
# VIDEO UPLOAD HANDLING
# ============================================================================

async def save_video_to_storage(
    video_file: UploadFile,
    access_token: str,
    question_id: str
) -> str:
    """
    Save uploaded video to storage (S3 or local filesystem)
    
    Returns: video_url (URL where video can be accessed)
    """
    
    # Option 1: Save to AWS S3 (PRODUCTION)
    if os.getenv("USE_S3_STORAGE", "false").lower() == "true":
        import boto3
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "us-east-1")
        )
        
        bucket_name = os.getenv("S3_BUCKET_NAME")
        file_key = f"video-screenings/{access_token}/{question_id}.webm"
        
        # Upload to S3
        s3_client.upload_fileobj(
            video_file.file,
            bucket_name,
            file_key,
            ExtraArgs={'ContentType': 'video/webm'}
        )
        
        # Generate URL (or use CloudFront URL)
        video_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        
        return video_url
    
    # Option 2: Save to local filesystem (DEVELOPMENT)
    else:
        upload_dir = f"uploads/video-screenings/{access_token}"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = f"{upload_dir}/{question_id}.webm"
        
        # Save file
        with open(file_path, "wb") as f:
            content = await video_file.read()
            f.write(content)
        
        # Return local URL
        video_url = f"/uploads/video-screenings/{access_token}/{question_id}.webm"
        
        return video_url


# ============================================================================
# ENDPOINT 1: GET SCREENING INFO (Landing Page Data)
# ============================================================================

@router.get("/{access_token}/info")
async def get_screening_info(
    access_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get video screening information for landing page
    
    USED BY: VideoScreeningLanding.tsx
    
    FLOW:
    1. Validate access_token exists
    2. Check if not expired (7 days)
    3. Check if not already completed
    4. Return job details, question count, etc.
    
    RESPONSE:
    {
        "invitation_id": "uuid",
        "job_title": "Senior Python Developer",
        "company_name": "TechCorp",
        "questions_count": 3,
        "estimated_time": 10,
        "expires_at": "2026-05-01T10:00:00Z",
        "status": "pending"
    }
    """
    
    # Find invitation by access token
    result = await db.execute(
        select(VideoScreeningInvitation)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    invitation = result.scalars().first()
    
    # Not found
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    # Already completed
    if invitation.status == 'completed':
        raise HTTPException(status_code=410, detail="This video screening has already been completed")
    
    # Expired (7 days validity)
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="This invitation has expired")
    
    # Get job details
    job = await db.get(Job, invitation.job_id)
    
    # Get template (to count questions)
    template = await db.get(VideoScreeningTemplate, invitation.template_id)
    questions = template.questions  # JSON array
    
    return {
        "invitation_id": str(invitation.id),
        "job_title": job.title,
        "company_name": job.company.name,
        "questions_count": len(questions),
        "estimated_time": len(questions) * 3,  # 3 mins per question (2 min record + 1 min think)
        "expires_at": invitation.expires_at.isoformat(),
        "status": invitation.status
    }


# ============================================================================
# ENDPOINT 2: GET QUESTIONS (Recording Page Data)
# ============================================================================

@router.get("/{access_token}/questions")
async def get_screening_questions(
    access_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all questions for video screening
    
    USED BY: VideoRecordingPage.tsx
    
    RESPONSE:
    {
        "questions": [
            {
                "id": "q1-uuid",
                "question_text": "Tell us about yourself and your experience",
                "question_order": 1,
                "max_duration": 120
            },
            {
                "id": "q2-uuid",
                "question_text": "Why do you want to work here?",
                "question_order": 2,
                "max_duration": 120
            },
            ...
        ]
    }
    """
    
    # Find invitation
    result = await db.execute(
        select(VideoScreeningInvitation)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid access token")
    
    # Get template
    template = await db.get(VideoScreeningTemplate, invitation.template_id)
    
    # Format questions
    questions = []
    for idx, q in enumerate(template.questions, start=1):
        questions.append({
            "id": q.get("id", f"q{idx}"),
            "question_text": q["text"],
            "question_order": idx,
            "max_duration": q.get("max_duration", 120)  # Default 2 minutes
        })
    
    return {"questions": questions}


# ============================================================================
# ENDPOINT 3: SUBMIT VIDEO RESPONSE
# ============================================================================

@router.post("/{access_token}/submit-response")
async def submit_video_response(
    access_token: str,
    video: UploadFile = File(...),
    question_id: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a video response for a question
    
    USED BY: VideoRecordingPage.tsx (for each question)
    
    REQUEST:
    - FormData with:
      - video: Blob (video file)
      - question_id: string
    
    FLOW:
    1. Validate access_token
    2. Save video to storage (S3 or local)
    3. Save video URL to database
    4. Return success
    
    NOTE: AI analysis happens later (after all videos submitted)
    
    RESPONSE:
    {
        "success": true,
        "video_url": "https://s3.amazonaws.com/...",
        "message": "Video uploaded successfully"
    }
    """
    
    # Validate invitation
    result = await db.execute(
        select(VideoScreeningInvitation)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid access token")
    
    # Check file type
    if not video.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Save video to storage
    try:
        video_url = await save_video_to_storage(video, access_token, question_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")
    
    # Save to database
    from models import VideoScreeningResponse
    
    response = VideoScreeningResponse(
        invitation_id=invitation.id,
        question_id=question_id,
        video_url=video_url,
        submitted_at=datetime.utcnow()
    )
    
    db.add(response)
    await db.commit()
    
    return {
        "success": True,
        "video_url": video_url,
        "message": "Video uploaded successfully"
    }


# ============================================================================
# ENDPOINT 4: MARK SCREENING COMPLETE
# ============================================================================

@router.post("/{access_token}/complete")
async def complete_video_screening(
    access_token: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark video screening as complete and trigger AI analysis
    
    USED BY: VideoRecordingPage.tsx (after all videos uploaded)
    
    FLOW:
    1. Validate all videos submitted
    2. Mark invitation as 'completed'
    3. Trigger AI analysis in background
    4. Send confirmation email to candidate
    5. Return success
    
    BACKGROUND TASKS:
    - Transcribe all videos (AssemblyAI)
    - Analyze with GPT-4
    - Calculate scores
    - Send notification to recruiter
    
    RESPONSE:
    {
        "success": true,
        "message": "Video screening completed successfully"
    }
    """
    
    # Find invitation
    result = await db.execute(
        select(VideoScreeningInvitation)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid access token")
    
    # Get template to count expected questions
    template = await db.get(VideoScreeningTemplate, invitation.template_id)
    expected_count = len(template.questions)
    
    # Check all videos submitted
    result = await db.execute(
        select(VideoScreeningResponse)
        .where(VideoScreeningResponse.invitation_id == invitation.id)
    )
    responses = result.scalars().all()
    
    if len(responses) < expected_count:
        raise HTTPException(
            status_code=400, 
            detail=f"Only {len(responses)} of {expected_count} videos submitted"
        )
    
    # Mark as completed
    invitation.status = 'completed'
    invitation.completed_at = datetime.utcnow()
    
    await db.commit()
    
    # Trigger AI analysis in background
    background_tasks.add_task(
        analyze_video_screening,
        invitation_id=invitation.id,
        db=db
    )
    
    return {
        "success": True,
        "message": "Video screening completed successfully"
    }


async def analyze_video_screening(invitation_id: UUID, db: AsyncSession):
    """
    Background task: Analyze all videos with AI
    
    This runs AFTER candidate submits all videos.
    
    STEPS:
    1. Get all video responses
    2. Transcribe each video (AssemblyAI)
    3. Analyze with GPT-4
    4. Calculate scores (content, communication, technical)
    5. Generate overall score
    6. Create AI recommendation (invite/review/reject)
    7. Send notification to recruiter
    """
    
    service = VideoScreeningService(
        db=db,
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        assemblyai_api_key=os.getenv("ASSEMBLYAI_API_KEY")
    )
    
    # Analyze all videos
    await service.analyze_all_videos(invitation_id)
    
    # Send notification to recruiter
    # (You can add email notification here)


# ============================================================================
# ENDPOINT 5: GET COMPLETION INFO (Thank You Page Data)
# ============================================================================

@router.get("/{access_token}/completion-info")
async def get_completion_info(
    access_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get information for completion/thank you page
    
    USED BY: VideoScreeningComplete.tsx
    
    RESPONSE:
    {
        "job_title": "Senior Python Developer",
        "company_name": "TechCorp",
        "submitted_at": "2026-04-20T14:30:00Z",
        "expected_response_days": 5
    }
    """
    
    # Find invitation
    result = await db.execute(
        select(VideoScreeningInvitation)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid access token")
    
    # Get job
    job = await db.get(Job, invitation.job_id)
    
    return {
        "job_title": job.title,
        "company_name": job.company.name,
        "submitted_at": invitation.completed_at.isoformat() if invitation.completed_at else datetime.utcnow().isoformat(),
        "expected_response_days": 5  # Typical response time
    }


# ============================================================================
# HELPER: Generate Pre-Signed S3 URL (Optional)
# ============================================================================

@router.post("/{access_token}/get-upload-url")
async def get_video_upload_url(
    access_token: str,
    question_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate pre-signed S3 URL for direct upload from frontend
    
    OPTIONAL: Use this for faster uploads (client → S3 directly)
    Instead of: client → backend → S3
    
    RESPONSE:
    {
        "upload_url": "https://s3.amazonaws.com/...",
        "video_url": "https://cdn.example.com/..."
    }
    """
    
    # Validate access token
    result = await db.execute(
        select(VideoScreeningInvitation)
        .where(VideoScreeningInvitation.access_token == access_token)
    )
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid access token")
    
    # Generate pre-signed URL
    import boto3
    
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION", "us-east-1")
    )
    
    bucket_name = os.getenv("S3_BUCKET_NAME")
    file_key = f"video-screenings/{access_token}/{question_id}.webm"
    
    # Generate pre-signed PUT URL (valid for 1 hour)
    upload_url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': bucket_name,
            'Key': file_key,
            'ContentType': 'video/webm'
        },
        ExpiresIn=3600  # 1 hour
    )
    
    # Final video URL (after upload)
    video_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
    
    return {
        "upload_url": upload_url,
        "video_url": video_url
    }
