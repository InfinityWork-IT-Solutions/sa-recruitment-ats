from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.api.v1.router import api_router
from app.core.config import settings

# Load environment variables
load_dotenv()

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title=os.getenv("APP_NAME", "RecruitPro SA"),
    description="SA Recruitment ATS - Backend API",
    version="1.0.0",
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    with open("trace.log", "w") as f:
        f.write(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc), "trace": traceback.format_exc()})

from fastapi.staticfiles import StaticFiles

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def on_startup():
    from app.tasks.daily_jobs import setup_scheduler
    app.state.scheduler = setup_scheduler()

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {os.getenv('APP_NAME', 'RecruitPro SA')} API",
        "status": "online",
        "version": "1.0.0",
        "scheduler": "active"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
