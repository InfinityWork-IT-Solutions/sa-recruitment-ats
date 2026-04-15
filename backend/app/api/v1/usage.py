
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Agency, SubscriptionPlanLimits, CompanyUsageTracking, UsageLog, User
from app.middleware.usage_limits import get_or_create_usage_tracking

router = APIRouter()

@router.get("/current")
async def get_current_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current usage statistics for agency dashboard
    """
    agency_id = current_user.agency_id
    if not agency_id:
        raise HTTPException(404, "Agency not found")
    
    # Get agency to find plan
    result = await db.execute(select(Agency).filter(Agency.id == agency_id))
    agency = result.scalars().first()
    
    plan_name = agency.subscription_tier.value
    
    # Get plan limits
    limits_result = await db.execute(
        select(SubscriptionPlanLimits).filter(
            SubscriptionPlanLimits.plan_name == plan_name
        )
    )
    plan_limits = limits_result.scalars().first()
    
    # Get current usage
    usage = await get_or_create_usage_tracking(agency_id, db)
    
    # Defaults if limits not set in DB
    def_cv = 50 if plan_name == 'lite' else 500
    def_match = 500 if plan_name == 'lite' else 5000
    def_search = 200 if plan_name == 'lite' else 2000
    
    cv_limit = plan_limits.cv_parses_per_month if plan_limits else def_cv
    match_limit = plan_limits.ai_match_calculations_per_month if plan_limits else def_match
    search_limit = plan_limits.ai_search_queries_per_month if plan_limits else def_search
    
    return {
        'plan': plan_name,
        'billing_period': {
            'start': usage.billing_period_start.isoformat(),
            'end': usage.billing_period_end.isoformat()
        },
        'cv_parses': {
            'limit': cv_limit,
            'used': usage.cv_parses_used,
            'remaining': max(0, cv_limit - usage.cv_parses_used) if cv_limit != -1 else -1,
            'percentage': round((usage.cv_parses_used / cv_limit) * 100) if cv_limit > 0 else 0
        },
        'ai_matches': {
            'limit': match_limit,
            'used': usage.ai_match_calculations_used,
            'remaining': max(0, match_limit - usage.ai_match_calculations_used) if match_limit != -1 else -1,
            'percentage': round((usage.ai_match_calculations_used / match_limit) * 100) if match_limit > 0 else 0
        },
        'ai_searches': {
            'limit': search_limit,
            'used': usage.ai_search_queries_used,
            'remaining': max(0, search_limit - usage.ai_search_queries_used) if search_limit != -1 else -1,
            'percentage': round((usage.ai_search_queries_used / search_limit) * 100) if search_limit > 0 else 0
        },
        'estimated_cost': float(usage.estimated_ai_cost_zar)
    }

@router.get("/history")
async def get_usage_history(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get usage history for the past N days
    """
    agency_id = current_user.agency_id
    if not agency_id:
        return {"error": "No agency context"}
    
    # Get usage logs
    since = datetime.now() - timedelta(days=days)
    result = await db.execute(
        select(UsageLog)
        .filter(UsageLog.agency_id == agency_id, UsageLog.created_at >= since)
        .order_by(UsageLog.created_at.desc())
    )
    logs = result.scalars().all()
    
    # Simple summary
    return {
        'period_days': days,
        'total_operations': len(logs),
        'total_cost': sum(float(log.estimated_cost_zar or 0) for log in logs)
    }
