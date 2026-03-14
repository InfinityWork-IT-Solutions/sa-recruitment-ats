"""
API v1 Router - Main router for all v1 endpoints (UPDATED with Sprint 3)
"""
from fastapi import APIRouter

from app.api.v1 import auth, jobs, client_companies, candidates, applications

# Create main API router
api_router = APIRouter()

# Include authentication router
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# Include jobs router (Sprint 2)
api_router.include_router(
    jobs.router,
    prefix="/jobs",
    tags=["Jobs"]
)

# Include client companies router (Sprint 2)
api_router.include_router(
    client_companies.router,
    prefix="/client-companies",
    tags=["Client Companies"]
)

# Include candidates router (Sprint 3)
api_router.include_router(
    candidates.router,
    prefix="/candidates",
    tags=["Candidates"]
)

# Include applications router (Sprint 3)
api_router.include_router(
    applications.router,
    prefix="/applications",
    tags=["Applications"]
)


@api_router.get("/")
async def api_root():
    """API v1 root endpoint"""
    return {
        "message": "SA Recruitment ATS API v1",
        "version": "1.0.0",
        "sprints_completed": ["Sprint 1: Auth", "Sprint 2: Jobs", "Sprint 3: Candidates & Applications"],
        "endpoints": {
            "auth": "/auth",
            "jobs": "/jobs",
            "client_companies": "/client-companies",
            "candidates": "/candidates",
            "applications": "/applications",
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
