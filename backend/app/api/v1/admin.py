from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_super_admin
from app.models import User, Agency, Job, Application, UserRole, JobStatus, Candidate
from app.models.agency import SubscriptionTier

router = APIRouter()

@router.get("/dashboard")
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """Get admin dashboard statistics (System-wide)"""
    
    # Count users by type
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    total_agencies_result = await db.execute(select(func.count(Agency.id)))
    total_agencies = total_agencies_result.scalar() or 0
    
    total_candidates_result = await db.execute(select(func.count(User.id)).filter(User.role == UserRole.candidate))
    total_candidates = total_candidates_result.scalar() or 0
    
    # Count jobs
    total_jobs_result = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_result.scalar() or 0
    
    active_jobs_result = await db.execute(select(func.count(Job.id)).filter(Job.status == JobStatus.active))
    active_jobs = active_jobs_result.scalar() or 0
    
    # Count applications
    total_applications_result = await db.execute(select(func.count(Application.id)))
    total_applications = total_applications_result.scalar() or 0
    
    # Calculate revenue (Simplified: active non-trial agencies * tier price)
    from datetime import datetime
    active_subs_result = await db.execute(
        select(Agency).filter(
            Agency.is_active == True,
            Agency.is_trial == False
        )
    )
    active_agencies = active_subs_result.scalars().all()
    
    monthly_revenue = 0
    prices = {
        SubscriptionTier.starter: 1015,
        SubscriptionTier.professional: 840,
        SubscriptionTier.enterprise: 0,
    }
    for agency in active_agencies:
        monthly_revenue += prices.get(agency.subscription_tier, 840) * (agency.max_users or 1)
    
    # Recent activity mockup (In real system, query Activity model)
    recent_activity = [
        {
            "type": "signup",
            "title": "New Agency Joint",
            "description": "TechRecruit Solutions signed up for a trial.",
            "timestamp": "2 hours ago"
        },
        {
            "type": "subscription",
            "title": "Subscription Upgraded",
            "description": "Global HR moved to Premium tier.",
            "timestamp": "5 hours ago"
        }
    ]
    
    total_consent_result = await db.execute(
        select(func.count(Candidate.id)).filter(Candidate.consent_to_contact == True)
    )
    total_candidate_consent = total_consent_result.scalar() or 0
    
    return {
        'stats': {
            'totalUsers': total_users,
            'totalAgencies': total_agencies, 
            'totalCandidates': total_candidates,
            'talentConsent': total_candidate_consent,
            'totalJobs': total_jobs,
            'activeJobs': active_jobs,
            'totalApplications': total_applications,
            'monthlyRevenue': monthly_revenue,
            'activeSubscriptions': len(active_agencies),
        },
        'recent_activity': recent_activity
    }

@router.get("/users")
async def get_users(
    user_type: str = 'all',
    search: str = '',
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """Get all users with filters"""
    
    query = select(User)
    
    # Use selectinload to avoid N+1 queries
    from sqlalchemy.orm import selectinload
    query = select(User).options(
        selectinload(User.agency),
        selectinload(User.client_company)
    )
    
    if user_type != 'all':
        # Match user_type string to UserRole enum values/keys
        for role in UserRole:
            if role.value == user_type:
                query = query.filter(User.role == role)
                break
    
    if search:
        query = query.filter(
            (User.email.ilike(f'%{search}%')) | 
            (User.first_name.ilike(f'%{search}%')) |
            (User.last_name.ilike(f'%{search}%'))
        )
    
    result = await db.execute(query)
    users_list = result.scalars().all()
    
    return {
        'users': [
            {
                "id": str(u.id),
                "name": u.full_name,
                "email": u.email,
                "user_type": u.role.value,
                "status": "active" if u.is_active else "suspended",
                "is_verified": u.is_verified,
                "agency_name": u.agency.name if u.agency else None,
                "subscription_tier": u.agency.subscription_tier.value if u.agency else None,
                "company_name": u.client_company.name if u.client_company else None,
                "created_at": u.created_at.isoformat()
            } for u in users_list
        ]
    }

@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """Suspend a user account"""
    import uuid
    uid = uuid.UUID(user_id)
    result = await db.execute(select(User).filter(User.id == uid))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    await db.commit()
    
    return {'message': 'User suspended successfully'}

@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """Activate a suspended user"""
    import uuid
    uid = uuid.UUID(user_id)
    result = await db.execute(select(User).filter(User.id == uid))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    await db.commit()
    
    return {'message': 'User activated successfully'}

@router.post("/trigger-job-match")
async def trigger_job_match(
    current_admin: User = Depends(get_current_super_admin)
):
    """Manually trigger the daily job match email task"""
    from app.tasks.daily_jobs import send_daily_job_matches
    # Run it in background
    import asyncio
    asyncio.create_task(send_daily_job_matches())
    
    return {'message': 'Job match synchronisation started in background'}
