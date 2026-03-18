from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import Optional, List, Union
import os

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "RecruitPro SA"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AWS Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "af-south-1"
    S3_BUCKET_RESUMES: str = "recruiter-ats-resumes-dev"
    S3_BUCKET_EXPORTS: str = "recruiter-ats-exports-dev"
    
    # OpenAI Settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    
    # SendGrid Settings
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: Optional[str] = None
    SENDGRID_FROM_NAME: str = "RecruitPro SA"
    
    # Google Calendar Settings
    GOOGLE_SERVICE_ACCOUNT_FILE: Optional[str] = None
    GOOGLE_CALENDAR_ID: str = "primary"
    
    # Internationalization
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: Union[str, List[str]] = ["en", "af", "zu"]

    @field_validator("SUPPORTED_LANGUAGES", mode="before")
    @classmethod
    def assemble_supported_languages(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = True

settings = Settings()
