"""
Configuration updates for Sprint 4 features

Add these settings to app/core/config.py
"""

from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # ... existing settings ...
    
    # ============= SPRINT 4: AI RESUME PARSING =============
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4"  # or "gpt-4-turbo"
    
    # ============= SPRINT 4: EMAIL NOTIFICATIONS =============
    SENDGRID_API_KEY: str
    SENDGRID_FROM_EMAIL: str  # e.g., "noreply@infinityworkitsolutions.com"
    SENDGRID_FROM_NAME: str = "RecruitPro SA"
    
    # ============= SPRINT 4: GOOGLE CALENDAR =============
    GOOGLE_SERVICE_ACCOUNT_FILE: str  # Path to service account JSON
    GOOGLE_CALENDAR_ID: str = "primary"  # or specific calendar ID
    
    # ============= SPRINT 4: INTERNATIONALIZATION =============
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: List[str] = ["en", "af", "zu"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
