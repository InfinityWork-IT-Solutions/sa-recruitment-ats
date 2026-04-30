"""
============================================================================
MAIN FASTAPI APPLICATION - VIDEO SCREENING INTEGRATION
============================================================================

This file shows how to integrate video screening endpoints into your
main FastAPI application.

SETUP STEPS:
1. Copy video_screening_api.py to your project
2. Copy recruiter_video_review_api.py to your project
3. Add imports and router registration in main.py (this file)
4. Configure environment variables
5. Test endpoints

============================================================================
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Import your existing routers
# from auth_api import router as auth_router
# from jobs_api import router as jobs_router
# etc...

# Import NEW video screening routers
from video_screening_api import router as video_screening_router
from recruiter_video_review_api import router as recruiter_video_router

# Create FastAPI app
app = FastAPI(
    title="RecruitPro SA API",
    description="AI-Powered Recruitment Platform",
    version="1.0.0"
)

# ============================================================================
# CORS CONFIGURATION (Allow frontend to call API)
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative frontend port
        "https://recruitpro.sa",  # Production frontend
        "https://www.recruitpro.sa"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# ============================================================================
# STATIC FILES (For serving uploaded videos if using local storage)
# ============================================================================

# Only if NOT using S3 - serves videos from local filesystem
if os.getenv("USE_S3_STORAGE", "false").lower() == "false":
    app.mount(
        "/uploads",
        StaticFiles(directory="uploads"),
        name="uploads"
    )

# ============================================================================
# REGISTER ROUTERS
# ============================================================================

# Existing routers (examples)
# app.include_router(auth_router)
# app.include_router(jobs_router)
# app.include_router(applications_router)
# etc...

# NEW: Video screening routers
app.include_router(video_screening_router)  # Candidate endpoints
app.include_router(recruiter_video_router)  # Recruiter endpoints

# ============================================================================
# ROOT ENDPOINT (Health check)
# ============================================================================

@app.get("/")
async def root():
    return {
        "message": "RecruitPro SA API",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "AI Video Screening",
            "Automated Candidate Screening",
            "Semi-Auto Mode",
            "Interview Scheduling"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ============================================================================
# STARTUP EVENT (Run migrations, etc.)
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Runs when the API starts
    
    Good place to:
    - Run database migrations
    - Initialize services
    - Check environment variables
    """
    
    # Check required environment variables
    required_env_vars = [
        "DATABASE_URL",
        "OPENAI_API_KEY",
        "ASSEMBLYAI_API_KEY",
        "SENDGRID_API_KEY"
    ]
    
    missing = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing:
        print(f"⚠️ WARNING: Missing environment variables: {', '.join(missing)}")
    else:
        print("✅ All required environment variables present")
    
    # Check video storage configuration
    if os.getenv("USE_S3_STORAGE", "false").lower() == "true":
        print("📦 Using AWS S3 for video storage")
        if not os.getenv("AWS_ACCESS_KEY_ID"):
            print("⚠️ WARNING: S3 enabled but AWS credentials missing")
    else:
        print("💾 Using local filesystem for video storage")
        os.makedirs("uploads/video-screenings", exist_ok=True)

# ============================================================================
# RUN THE APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Auto-reload on code changes (dev only)
    )


# ============================================================================
# EXAMPLE .ENV FILE
# ============================================================================

"""
Copy this to .env file in your project root:

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/recruitpro_db

# AI Services
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...

# Email
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@infinityworkitsolutions.com

# Video Storage
USE_S3_STORAGE=false  # Set to 'true' for production with S3

# AWS S3 (only needed if USE_S3_STORAGE=true)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=recruitpro-videos

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5173

# Security
SECRET_KEY=your-secret-key-here
"""
