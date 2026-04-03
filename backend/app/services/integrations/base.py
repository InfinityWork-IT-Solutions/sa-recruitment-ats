# backend/app/services/integrations/base.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

class BaseIntegrationService(ABC):
    """Base class for all job board integrations"""
    
    def __init__(self, company_id: str, credentials: Dict[str, Any]):
        self.company_id = company_id
        self.credentials = credentials
        self.platform_name = self.__class__.__name__.replace('Service', '').lower()
    
    @abstractmethod
    async def post_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Post job to platform
        Returns: {
            'success': bool,
            'platform_job_id': str,
            'url': str,
            'error': str (optional)
        }
        """
        pass
    
    @abstractmethod
    async def update_job(self, platform_job_id: str, job_data: Dict[str, Any]) -> bool:
        """Update existing job on platform"""
        pass
    
    @abstractmethod
    async def close_job(self, platform_job_id: str) -> bool:
        """Close/remove job from platform"""
        pass
    
    @abstractmethod
    async def get_job_stats(self, platform_job_id: str) -> Dict[str, int]:
        """
        Get job statistics
        Returns: {'views': int, 'applications': int}
        """
        pass
    
    def generate_application_url(self, job_id: str) -> str:
        """Generate redirect URL for applications"""
        base_url = "https://recruitpro.co.za"
        return f"{base_url}/jobs/{job_id}/apply?source={self.platform_name}"
