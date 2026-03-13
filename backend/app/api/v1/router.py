"""
API v1 Router
"""
from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/")
async def api_root():
    """API v1 root endpoint"""
    return {
        "message": "SA Recruitment ATS API v1",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/auth",
            "jobs": "/jobs",
            "candidates": "/candidates",
            "applications": "/applications",
            "agencies": "/agencies",
        },
    }


# Import and include routers here when created
# from app.api.v1 import auth, jobs, candidates
# api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
# api_router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
