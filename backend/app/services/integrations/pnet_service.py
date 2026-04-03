# backend/app/services/integrations/pnet_service.py
import httpx
from typing import Dict, Any
from .base import BaseIntegrationService

class PNetService(BaseIntegrationService):
    """PNet API Integration"""
    
    API_BASE_URL = "https://api.pnet.co.za/v1"
    
    async def post_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Post job to PNet"""
        try:
            async with httpx.AsyncClient() as client:
                # Map RecruitPro fields to PNet fields
                pnet_job = {
                    "title": job_data["title"],
                    "description": job_data["description"],
                    "location": job_data["location"],
                    "salary_min": job_data["salary_min"],
                    "salary_max": job_data["salary_max"],
                    "job_type": self._map_job_type(job_data["job_type"]),
                    "application_url": self.generate_application_url(job_data["id"]),
                    "company_name": job_data["company_name"],
                    "requirements": job_data["requirements"],
                }
                
                response = await client.post(
                    f"{self.API_BASE_URL}/jobs",
                    json=pnet_job,
                    headers={
                        "Authorization": f"Bearer {self.credentials['api_key']}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 201:
                    data = response.json()
                    return {
                        'success': True,
                        'platform_job_id': data['job_id'],
                        'url': data['job_url']
                    }
                else:
                    return {
                        'success': False,
                        'error': f"PNet API error: {response.text}"
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': f"PNet posting failed: {str(e)}"
            }
    
    async def update_job(self, platform_job_id: str, job_data: Dict[str, Any]) -> bool:
        """Update job on PNet"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.API_BASE_URL}/jobs/{platform_job_id}",
                    json=job_data,
                    headers={"Authorization": f"Bearer {self.credentials['api_key']}"}
                )
                return response.status_code == 200
        except:
            return False
    
    async def close_job(self, platform_job_id: str) -> bool:
        """Close job on PNet"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.API_BASE_URL}/jobs/{platform_job_id}",
                    headers={"Authorization": f"Bearer {self.credentials['api_key']}"}
                )
                return response.status_code == 200
        except:
            return False
    
    async def get_job_stats(self, platform_job_id: str) -> Dict[str, int]:
        """Get PNet job stats"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.API_BASE_URL}/jobs/{platform_job_id}/stats",
                    headers={"Authorization": f"Bearer {self.credentials['api_key']}"}
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'views': data.get('views', 0),
                        'applications': data.get('applications', 0)
                    }
        except:
            pass
        return {'views': 0, 'applications': 0}
    
    def _map_job_type(self, job_type: str) -> str:
        """Map RecruitPro job type to PNet format"""
        mapping = {
            'full-time': 'permanent',
            'part-time': 'part_time',
            'contract': 'contract',
            'internship': 'internship'
        }
        return mapping.get(job_type, 'permanent')
