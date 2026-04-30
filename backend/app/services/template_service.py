
import re
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.automation import MessageTemplate

class TemplateService:
    @staticmethod
    def render_template(template_body: str, variables: Dict[str, Any]) -> str:
        """
        Replace {{variable_name}} with values from the variables dictionary.
        """
        def replace(match):
            var_name = match.group(1).strip()
            return str(variables.get(var_name, match.group(0)))
            
        return re.sub(r'\{\{(.*?)\}\}', replace, template_body)

    @staticmethod
    async def get_template_by_type(db: AsyncSession, company_id: UUID, template_type: str) -> Optional[MessageTemplate]:
        """
        Get the default template of a specific type for a company.
        """
        stmt = select(MessageTemplate).where(
            MessageTemplate.company_id == company_id,
            MessageTemplate.template_type == template_type,
            MessageTemplate.is_active == True
        ).order_by(MessageTemplate.is_default.desc())
        
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def seed_default_templates(db: AsyncSession, company_id: UUID, user_id: UUID):
        """
        Seed professional default templates for a new company.
        """
        defaults = [
            {
                "name": "Interview Invitation",
                "type": "interview_invite",
                "subject": "Interview Invitation: {{job_title}} at {{company_name}}",
                "body": "Hi {{candidate_name}},\n\nWe were impressed by your background and would like to invite you for an interview for the {{job_title}} position.\n\nDetails:\nDate: {{interview_date}}\nTime: {{interview_time}}\nLocation: {{interview_location}}\n\nBest regards,\n{{recruiter_name}}\n{{company_name}}"
            },
            {
                "name": "Rejection Letter",
                "type": "rejection",
                "subject": "Update regarding your application for {{job_title}}",
                "body": "Hi {{candidate_name}},\n\nThank you for your interest in the {{job_title}} role at {{company_name}}.\n\nAfter careful consideration, we have decided to move forward with other candidates at this time. We appreciate you taking the time to apply and wish you the best in your job search.\n\nBest regards,\n{{company_name}} Team"
            },
            {
                "name": "Job Offer",
                "type": "job_offer",
                "subject": "Job Offer: {{job_title}} at {{company_name}}",
                "body": "Congratulations {{candidate_name}}!\n\nWe are thrilled to offer you the position of {{job_title}} at {{company_name}}. We believe your skills and experience will be a great asset to our team.\n\nOffer Amount: {{offer_amount}}\nProposed Start Date: {{start_date}}\n\nPlease let us know your decision by {{expiry_date}}.\n\nBest regards,\n{{recruiter_name}}\n{{company_name}}"
            }
        ]
        
        for d in defaults:
            # Check if exists
            stmt = select(MessageTemplate).where(
                MessageTemplate.company_id == company_id,
                MessageTemplate.template_type == d["type"]
            )
            existing = await db.execute(stmt)
            if not existing.scalars().first():
                template = MessageTemplate(
                    company_id=company_id,
                    name=d["name"],
                    template_type=d["type"],
                    subject=d["subject"],
                    body_template=d["body"],
                    is_default=True,
                    created_by=user_id
                )
                db.add(template)
        
        await db.commit()
