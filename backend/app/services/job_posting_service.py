# backend/app/services/job_posting_service.py
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.integration import IntegrationConnection
from app.models.job_platform import JobPlatformPosting
from .integrations.pnet_service import PNetService
from .integrations.indeed_service import IndeedService
from .integrations.linkedin_service import LinkedInService

class JobPostingService:
    """Orchestrates multi-platform job posting"""
    
    def __init__(self, db: Session, agency_id: str):
        self.db = db
        self.agency_id = agency_id
        # For backward compatibility or if company_id is used elsewhere
        self.company_id = agency_id
    
    async def post_job_to_platforms(
        self,
        job_dict: Dict[str, Any],
        platforms: List[str]
    ) -> Dict[str, Any]:
        """
        Post job to multiple platforms simultaneously
        
        Args:
            job_dict: Job information serialized as dictionary
            platforms: List of platforms ['pnet', 'indeed', 'linkedin']
        """
        results = {}
        for platform in platforms:
            service = await self._get_platform_service(platform)
            if service:
                result = await service.post_job(job_dict)
                results[platform] = result
                
                # Save to database if successful
                if result.get('success'):
                    await self._save_platform_posting(
                        job_dict['id'],
                        platform,
                        result.get('platform_job_id', 'EXTERNAL_ID')
                    )
            else:
                results[platform] = {
                    'success': False,
                    'error': f'Integration for {platform} not found or inactive'
                }
                
        return {
            'success': all(r.get('success', False) for r in results.values()),
            'results': results
        }
    
    async def close_job_on_all_platforms(self, job_id: str) -> bool:
        """Close job on all platforms it was posted to"""
        postings = self.db.query(JobPlatformPosting).filter_by(job_id=job_id).all()
        
        for posting in postings:
            service = await self._get_platform_service(posting.platform)
            if service:
                await service.close_job(posting.platform_job_id)
                posting.status = 'closed'
                posting.closed_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    async def _get_platform_service(self, platform: str):
        """Get integration service for platform"""
        # Get credentials from database
        connection = self.db.query(IntegrationConnection).filter_by(
            company_id=self.agency_id,
            platform=platform,
            status='active'
        ).first()
        
        if not connection:
            return None
        
        credentials = {
            'api_key': connection.api_key,
            'api_secret': connection.api_secret,
            'access_token': connection.access_token,
        }
        
        services = {
            'pnet': PNetService,
            'indeed': IndeedService,
            'linkedin': LinkedInService
        }
        
        service_class = services.get(platform)
        return service_class(self.agency_id, credentials) if service_class else None
    
    async def _save_platform_posting(
        self,
        job_id: str,
        platform: str,
        platform_job_id: str
    ):
        """Save job platform posting to database"""
        posting = JobPlatformPosting(
            job_id=job_id,
            platform=platform,
            platform_job_id=platform_job_id,
            status='active',
            posted_at=datetime.utcnow()
        )
        self.db.add(posting)
        self.db.commit()
