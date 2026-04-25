"""
RecruitPro SA - AI Decision Queue API Endpoints
FastAPI routes for Semi-Auto mode
"""

from typing import List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.services.ai_decision_queue_service import AIDecisionQueueService, DecisionType
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User, UserRole

router = APIRouter(prefix="/decisions", tags=["AI Decision Queue"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ApproveAllRequest(BaseModel):
    decision_ids: List[UUID]

class ApproveSingleRequest(BaseModel):
    decision_id: UUID
    modifications: Optional[dict] = None

class RejectDecisionRequest(BaseModel):
    decision_id: UUID
    reason: str

# ============================================================================
# SECURITY HELPER
# ============================================================================

def check_automation_permissions(user: User):
    """Only recruiters, admins and clients can manage AI decisions"""
    role_str = str(user.role.value) if hasattr(user.role, 'value') else str(user.role)
    print(f"DEBUG: Checking permissions for user {user.email} with role {role_str}")
    
    allowed_roles = ["super_admin", "agency_admin", "recruiter", "client"]
    if role_str not in allowed_roles:
        print(f"DEBUG: Permission denied. Role {role_str} not in {allowed_roles}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have permission to manage AI decisions (Role: {role_str})"
        )
    return True

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/pending")
async def get_pending_decisions(
    job_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all pending AI decisions for dashboard
    This powers the main Semi-Auto dashboard view
    """
    check_automation_permissions(current_user)
    service = AIDecisionQueueService(db)
    
    # If client, only show decisions for their company
    company_id = None
    if current_user.role == UserRole.client:
        from app.models.client_company import ClientCompany
        result = await db.execute(select(ClientCompany).where(ClientCompany.user_id == current_user.id))
        client_company = result.scalars().first()
        if client_company:
            company_id = client_company.id
            print(f"DEBUG: Found company_id {company_id} for client user {current_user.email}")
        else:
            print(f"DEBUG: No company found for client user {current_user.email}")
            # If a client has no company, they shouldn't see anything
            return {
                "totals": {"total_pending": 0, "auto_reject_count": 0, "video_screening_count": 0, "fast_track_count": 0},
                "summary": {"auto_reject": [], "send_video_screening": [], "fast_track_interview": [], "schedule_interview": [], "send_outreach": []},
                "all_decisions": []
            }
    else:
        print(f"DEBUG: User {current_user.email} is role {current_user.role}, showing all/unfiltered")

    try:
        decisions = await service.get_pending_decisions(
            job_id=job_id,
            company_id=company_id
        )
        return decisions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve-all")
async def approve_all_decisions(
    request: ApproveAllRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve multiple AI decisions with ONE CLICK
    """
    check_automation_permissions(current_user)
    service = AIDecisionQueueService(db)
    
    try:
        result = await service.approve_all_decisions(
            decision_ids=request.decision_ids,
            approved_by=current_user.id,
            execute_immediately=True
        )
        
        return {
            "success": True,
            "approved_count": result['approved_count'],
            "executed_count": result['executed_count'],
            "errors": result['errors'],
            "message": f"✅ Successfully executed {result['executed_count']} decisions!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve-single")
async def approve_single_decision(
    request: ApproveSingleRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve a single decision (optionally with modifications)
    """
    check_automation_permissions(current_user)
    service = AIDecisionQueueService(db)
    
    try:
        result = await service.approve_single_decision(
            decision_id=request.decision_id,
            approved_by=current_user.id,
            modifications=request.modifications
        )
        
        return {
            "success": True,
            "data": result,
            "message": "Decision approved and executed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject")
async def reject_decision(
    request: RejectDecisionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject an AI decision (recruiter disagrees)
    """
    check_automation_permissions(current_user)
    service = AIDecisionQueueService(db)
    
    try:
        result = await service.reject_decision(
            decision_id=request.decision_id,
            rejected_by=current_user.id,
            reason=request.reason
        )
        
        return {
            "success": True,
            "data": result,
            "message": "Decision rejected"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_decision_stats(
    job_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistics on AI decisions
    """
    check_automation_permissions(current_user)
    service = AIDecisionQueueService(db)
    
    try:
        stats = await service.get_decision_stats(
            job_id=job_id,
            date_from=date_from,
            date_to=date_to
        )
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
