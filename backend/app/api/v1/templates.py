
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.automation import MessageTemplate
from app.schemas.template import MessageTemplateCreate, MessageTemplateResponse, MessageTemplateUpdate, EmailPreviewRequest, EmailPreviewResponse
from app.services.template_service import TemplateService
from sqlalchemy import select

router = APIRouter()

@router.get("/", response_model=List[MessageTemplateResponse])
async def get_my_templates(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all templates for the current company/agency"""
    from app.models.user import UserRole
    
    if current_user.role == UserRole.client:
        # Clients see templates for their specific company
        await db.refresh(current_user, ["client_company"])
        company_id = current_user.client_company.id if current_user.client_company else None
        if not company_id:
            return []
        stmt = select(MessageTemplate).where(
            MessageTemplate.company_id == company_id
        )
    else:
        # Recruiters see agency-wide templates
        stmt = select(MessageTemplate).where(
            MessageTemplate.agency_id == current_user.agency_id,
            MessageTemplate.company_id == None
        )
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=MessageTemplateResponse)
async def create_template(
    template_data: MessageTemplateCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new template"""
    from app.models.user import UserRole
    
    company_id = None
    if current_user.role == UserRole.client:
        await db.refresh(current_user, ["client_company"])
        if current_user.client_company:
            company_id = current_user.client_company.id

    template = MessageTemplate(
        **template_data.model_dump(exclude={"company_id", "agency_id"}),
        agency_id=current_user.agency_id,
        company_id=company_id,
        created_by=current_user.id
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

@router.post("/preview", response_model=EmailPreviewResponse)
async def preview_template(
    request: EmailPreviewRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Preview a template with variables merged"""
    template = await db.get(MessageTemplate, request.template_id)
    if not template or template.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Template not found")
        
    subject = TemplateService.render_template(template.subject or "", request.variables)
    body = TemplateService.render_template(template.body_template, request.variables)
    
    return {"subject": subject, "body": body}

@router.post("/send-to-candidate")
async def send_to_candidate(
    candidate_id: UUID,
    template_id: UUID,
    custom_subject: Optional[str] = None,
    custom_body: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Render a template and send the email to a candidate"""
    from app.models.candidate import Candidate
    from app.services.email_automation_service import EmailAutomationService
    
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    template = await db.get(MessageTemplate, template_id)
    if not template or template.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Use custom content if provided, otherwise render template
    subject = custom_subject or TemplateService.render_template(template.subject or "", {"candidate_name": candidate.full_name})
    body = custom_body or TemplateService.render_template(template.body_template, {"candidate_name": candidate.full_name})
    
    # Send the email
    try:
        await EmailAutomationService.send_generic_email(
            recipient_email=candidate.email,
            subject=subject,
            body=body,
            company_name=current_user.agency_name or "RecruitPro"
        )
        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/seed")
async def seed_templates(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Seed default professional templates for the user's company"""
    from app.models.user import UserRole
    
    if not current_user.agency_id:
        raise HTTPException(status_code=400, detail="User not associated with an agency")
    
    company_id = None
    if current_user.role == UserRole.client:
        await db.refresh(current_user, ["client_company"])
        if current_user.client_company:
            company_id = current_user.client_company.id

    await TemplateService.seed_default_templates(db, current_user.agency_id, current_user.id, company_id)
    return {"message": "Default templates seeded successfully"}

@router.put("/{template_id}", response_model=MessageTemplateResponse)
async def update_template(
    template_id: UUID,
    template_data: MessageTemplateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing template"""
    template = await db.get(MessageTemplate, template_id)
    if not template or template.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Template not found")
        
    for field, value in template_data.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
        
    await db.commit()
    await db.refresh(template)
    return template

@router.delete("/{template_id}")
async def delete_template(
    template_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a template"""
    template = await db.get(MessageTemplate, template_id)
    if not template or template.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Template not found")
        
    await db.delete(template)
    await db.commit()
    return {"message": "Template deleted successfully"}
