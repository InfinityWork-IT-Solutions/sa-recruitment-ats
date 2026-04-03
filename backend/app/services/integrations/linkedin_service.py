# backend/app/services/integrations/linkedin_service.py
import httpx
from typing import Dict, Any
from .base import BaseIntegrationService

class LinkedInService(BaseIntegrationService):
    """LinkedIn API Integration"""
    
    API_BASE_URL = "https://api.linkedin.com/v2"
    
    async def post_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post job to LinkedIn"""
        try:
            async with httpx.AsyncClient() as client:
                linkedin_job = {
                    "title": job_data["title"],
                    "description": job_data["description"],
                    "location": self._format_location(job_data["location"]),
                    "listedAt": int(job_data["created_at"].timestamp() * 1000) if getattr(job_data["created_at"], "timestamp", None) else 0,
                    "jobFunction": "eng",  # Engineering - map from your data
                    "industries": ["software"],
                    "applyUrl": self.generate_application_url(job_data["id"])
                }
                
                response = await client.post(
                    f"{self.API_BASE_URL}/simpleJobPostings",
                    json=linkedin_job,
                    headers={
                        "Authorization": f"Bearer {self.credentials['access_token']}",
                        "LinkedIn-Version": "202304"
                    }
                )
                
                if response.status_code == 201:
                    data = response.json()
                    return {
                        'success': True,
                        'platform_job_id': data['id'],
                        'url': f"https://www.linkedin.com/jobs/view/{data['id']}"
                    }
                else:
                    return {
                        'success': False,
                        'error': f"LinkedIn API error: {response.text}"
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': f"LinkedIn posting failed: {str(e)}"
            }
    
    async def update_job(self, platform_job_id: str, job_data: Dict[str, Any]) -> bool:
        """Update job on LinkedIn"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.API_BASE_URL}/simpleJobPostings/{platform_job_id}",
                    json=job_data,
                    headers={"Authorization": f"Bearer {self.credentials['access_token']}"}
                )
                return response.status_code == 200
        except:
            return False
    
    async def close_job(self, platform_job_id: str) -> bool:
        """Close job on LinkedIn"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.API_BASE_URL}/simpleJobPostings/{platform_job_id}",
                    headers={"Authorization": f"Bearer {self.credentials['access_token']}"}
                )
                return response.status_code == 204
        except:
            return False
    
    async def get_job_stats(self, platform_job_id: str) -> Dict[str, int]:
        """Get LinkedIn job stats"""
        # LinkedIn provides analytics through separate endpoint
        return {'views': 0, 'applications': 0}
    
    def _format_location(self, location: str) -> str:
        """Convert location to LinkedIn URN format"""
        # This would need mapping to LinkedIn location IDs
        # For now, return as-is
        return location
