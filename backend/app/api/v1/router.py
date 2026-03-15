"""
API v1 Router - Updated with Sprint 4 endpoints
"""
from fastapi import APIRouter

from app.api.v1 import auth, jobs, client_companies, candidates, applications, analytics, i18n

# Create main API router
api_router = APIRouter()

# Sprint 1: Authentication
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# Sprint 2: Jobs
api_router.include_router(
    jobs.router,
    prefix="/jobs",
    tags=["Jobs"]
)

# Sprint 2: Client Companies
api_router.include_router(
    client_companies.router,
    prefix="/client-companies",
    tags=["Client Companies"]
)

# Sprint 3: Candidates
api_router.include_router(
    candidates.router,
    prefix="/candidates",
    tags=["Candidates"]
)

# Sprint 3: Applications
api_router.include_router(
    applications.router,
    prefix="/applications",
    tags=["Applications"]
)

# Sprint 4: Analytics & Reporting
api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics & Reporting"]
)

# Sprint 4: Internationalization
api_router.include_router(
    i18n.router,
    prefix="/i18n",
    tags=["Internationalization"]
)


@api_router.get("/")
async def api_root():
    """API v1 root endpoint"""
    return {
        "message": "SA Recruitment ATS API v1",
        "version": "1.0.0",
        "sprints_completed": [
            "Sprint 1: Authentication & Users",
            "Sprint 2: Jobs & Client Companies",
            "Sprint 3: Candidates & Applications",
            "Sprint 4: AI, Email, Calendar, Analytics, i18n"
        ],
        "features": {
            "ai_resume_parsing": "OpenAI GPT-4",
            "email_notifications": "SendGrid",
            "calendar_integration": "Google Calendar",
            "analytics_reporting": "Advanced metrics & exports",
            "multi_language": "EN, AF, ZU"
        },
        "endpoints": {
            "auth": "/auth",
            "jobs": "/jobs",
            "client_companies": "/client-companies",
            "candidates": "/candidates",
            "applications": "/applications",
            "analytics": "/analytics",
            "i18n": "/i18n",
            "docs": "/docs",
            "health": "/health",
        },
        "documentation": "/docs"
    }



# Import and include routers here when created
# from app.api.v1 import auth, jobs, candidates
# api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
# api_router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
