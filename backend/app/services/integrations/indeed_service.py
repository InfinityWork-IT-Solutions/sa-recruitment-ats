# backend/app/services/integrations/indeed_service.py
from typing import Dict, Any
from .base import BaseIntegrationService
from xml.etree.ElementTree import Element, SubElement, tostring

class IndeedService(BaseIntegrationService):
    """Indeed XML Feed Integration"""
    
    async def post_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Indeed uses XML feed - jobs are added to feed, Indeed pulls them
        This method adds job to the XML feed generator
        """
        try:
            # Job will be included in next XML feed generation
            # Indeed pulls the feed every 24 hours
            return {
                'success': True,
                'platform_job_id': f"indeed_{job_data['id']}",
                'url': f"https://www.indeed.com/viewjob?jk={job_data['id']}"
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Indeed feed error: {str(e)}"
            }
    
    async def update_job(self, platform_job_id: str, job_data: Dict[str, Any]) -> bool:
        """Update job in XML feed"""
        # Indeed will pick up changes on next feed pull
        return True
    
    async def close_job(self, platform_job_id: str) -> bool:
        """Remove job from XML feed"""
        # Job removed from feed = automatically removed from Indeed
        return True
    
    async def get_job_stats(self, platform_job_id: str) -> Dict[str, int]:
        """Indeed doesn't provide stats via XML feed"""
        return {'views': 0, 'applications': 0}
    
    @staticmethod
    def generate_xml_feed(jobs: list) -> str:
        """Generate Indeed XML feed for all active jobs"""
        root = Element('source')
        
        publisher = SubElement(root, 'publisher')
        publisher.text = 'RecruitPro SA'
        
        publisherurl = SubElement(root, 'publisherurl')
        publisherurl.text = 'https://recruitpro.co.za'
        
        for job in jobs:
            job_elem = SubElement(root, 'job')
            
            SubElement(job_elem, 'title').text = job.get('title', 'Unknown Title')
            SubElement(job_elem, 'date').text = str(job.get('created_at', ''))
            SubElement(job_elem, 'referencenumber').text = str(job.get('id', ''))
            SubElement(job_elem, 'url').text = f"https://recruitpro.co.za/jobs/{job.get('id')}/apply?source=indeed"
            agency_name = job.get('company_name', 'RecruitPro SA')
            SubElement(job_elem, 'company').text = agency_name # Use agency as company
            
            # Using basic JSON values for mapping location as per standard
            city_val = job.get('city', 'Unknown')
            state_val = job.get('province', 'Unknown')
            
            SubElement(job_elem, 'city').text = city_val
            SubElement(job_elem, 'state').text = state_val
            SubElement(job_elem, 'country').text = 'ZA'
            SubElement(job_elem, 'description').text = f"<![CDATA[{job.get('description', '')}]]>"
            SubElement(job_elem, 'salary').text = f"R{job.get('salary_min', 0)} - R{job.get('salary_max', 0)}"
            SubElement(job_elem, 'jobtype').text = str(job.get('employment_type', 'full_time'))
        
        return tostring(root, encoding='unicode')
