
"""
Usage Limits Middleware - Protects AI costs by enforcing subscription limits
"""
from fastapi import HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, timedelta
from typing import Optional
import logging

from app.core.database import get_db
from app.models import Agency, CompanyUsageTracking, SubscriptionPlanLimits, UsageLog, UsageAlert, User
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

# AI Cost estimates (ZAR) - Update based on actual provider costs
AI_COSTS = {
    'cv_parse': 2.00,        # R2 per CV (Claude/GPT-4 API)
    'ai_match': 0.10,        # R0.10 per match calculation
    'ai_search': 0.20,       # R0.20 per semantic search
    'recommendation': 0.05   # R0.05 per recommendation
}


class UsageLimitError(Exception):
    """Raised when usage limit is exceeded"""
    def __init__(self, limit_type: str, limit: int, used: int):
        self.limit_type = limit_type
        self.limit = limit
        self.used = used
        super().__init__(f"{limit_type} limit exceeded: {used}/{limit}")


async def get_or_create_usage_tracking(
    agency_id: str,
    db: AsyncSession
) -> CompanyUsageTracking:
    """Get or create usage tracking record for current billing period"""
    
    # Get current billing period
    today = date.today()
    period_start = today.replace(day=1)
    
    # Calculate period end (last day of month)
    if today.month == 12:
        period_end = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        period_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
    
    # Get or create usage record
    result = await db.execute(
        select(CompanyUsageTracking).filter(
            CompanyUsageTracking.agency_id == agency_id,
            CompanyUsageTracking.billing_period_start == period_start
        )
    )
    usage = result.scalars().first()
    
    if not usage:
        usage = CompanyUsageTracking(
            agency_id=agency_id,
            billing_period_start=period_start,
            billing_period_end=period_end
        )
        db.add(usage)
        await db.commit()
        await db.refresh(usage)
    
    return usage


async def check_usage_limit(
    agency_id: str,
    usage_type: str,  # 'cv_parse', 'ai_match', 'ai_search'
    db: AsyncSession
) -> dict:
    """
    Check if agency can perform an AI operation.
    Returns usage info or raises UsageLimitError.
    """
    
    # Get agency and plan limits
    result = await db.execute(select(Agency).filter(Agency.id == agency_id))
    agency = result.scalars().first()
    if not agency:
        raise HTTPException(404, "Agency not found")
    
    # Map SubscriptionTier to plan name used in limits table
    # This project uses lowercase enum names: lite, standard, premium
    plan_name = agency.subscription_tier.value
    
    result = await db.execute(
        select(SubscriptionPlanLimits).filter(
            SubscriptionPlanLimits.plan_name == plan_name
        )
    )
    plan_limits = result.scalars().first()
    
    if not plan_limits:
        # Fallback: assign defaults if table not populated
        logger.warning(f"Plan limits not configured for {plan_name}. Using defaults.")
        limit = 50 if plan_name == 'lite' else 500
    else:
        # Check limit based on usage type
        if usage_type == 'cv_parse':
            limit = plan_limits.cv_parses_per_month
        elif usage_type == 'ai_match':
            limit = plan_limits.ai_match_calculations_per_month
        elif usage_type == 'ai_search':
            limit = plan_limits.ai_search_queries_per_month
        else:
            raise ValueError(f"Unknown usage type: {usage_type}")
    
    # Get current usage
    usage = await get_or_create_usage_tracking(agency_id, db)
    
    if usage_type == 'cv_parse':
        used = usage.cv_parses_used
        field_name = 'cv_parses_used'
    elif usage_type == 'ai_match':
        used = usage.ai_match_calculations_used
        field_name = 'ai_match_calculations_used'
    elif usage_type == 'ai_search':
        used = usage.ai_search_queries_used
        field_name = 'ai_search_queries_used'
    
    # Check if unlimited (-1)
    if limit == -1:
        return {
            'allowed': True,
            'limit': -1,
            'used': used,
            'remaining': -1,
            'percentage': 0,
            'field_name': field_name
        }
    
    # Check if limit exceeded
    if used >= limit:
        raise UsageLimitError(usage_type, limit, used)
    
    return {
        'allowed': True,
        'limit': limit,
        'used': used,
        'remaining': limit - used,
        'percentage': round((used / limit) * 100) if limit > 0 else 0,
        'field_name': field_name
    }


async def increment_usage(
    agency_id: str,
    usage_type: str,
    db: AsyncSession,
    user_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    tokens_used: Optional[int] = None,
    success: bool = True,
    error_message: Optional[str] = None
):
    """
    Increment usage counter after AI operation.
    Also logs detailed usage for analytics.
    """
    
    # Get usage tracking
    usage = await get_or_create_usage_tracking(agency_id, db)
    
    # Increment counter
    if usage_type == 'cv_parse':
        usage.cv_parses_used += 1
    elif usage_type == 'ai_match':
        usage.ai_match_calculations_used += 1
    elif usage_type == 'ai_search':
        usage.ai_search_queries_used += 1
    
    # Update estimated cost
    cost = AI_COSTS.get(usage_type, 0.0)
    usage.estimated_ai_cost_zar += cost
    
    # Log detailed usage
    log_entry = UsageLog(
        user_id=user_id,
        agency_id=agency_id,
        usage_type=usage_type,
        resource_id=resource_id,
        tokens_used=tokens_used,
        estimated_cost_zar=cost,
        success=success,
        error_message=error_message
    )
    db.add(log_entry)
    
    await db.commit()
    
    # Check if approaching limit and create alert
    await _check_and_create_alerts(agency_id, usage_type, usage, db)
    
    logger.info(f"Usage incremented: agency={agency_id}, type={usage_type}, cost=R{cost}")


async def _check_and_create_alerts(
    agency_id: str,
    usage_type: str,
    usage: CompanyUsageTracking,
    db: AsyncSession
):
    """Create alerts when usage reaches 80%, 90%, 100%"""
    
    # Get agency and limits
    result = await db.execute(select(Agency).filter(Agency.id == agency_id))
    agency = result.scalars().first()
    
    plan_name = agency.subscription_tier.value
    result = await db.execute(
        select(SubscriptionPlanLimits).filter(
            SubscriptionPlanLimits.plan_name == plan_name
        )
    )
    plan_limits = result.scalars().first()
    
    if not plan_limits:
        return
    
    # Determine limit and used
    if usage_type == 'cv_parse':
        limit = plan_limits.cv_parses_per_month
        used = usage.cv_parses_used
    elif usage_type == 'ai_match':
        limit = plan_limits.ai_match_calculations_per_month
        used = usage.ai_match_calculations_used
    elif usage_type == 'ai_search':
        limit = plan_limits.ai_search_queries_per_month
        used = usage.ai_search_queries_used
    else:
        return
    
    if limit <= 0 or limit == -1:
        return
    
    percentage = (used / limit) * 100
    
    # Check thresholds
    for threshold in [80, 90, 100]:
        if percentage >= threshold:
            alert_type = f"{usage_type}_{threshold}"
            
            # Check if alert already exists in current period
            alert_result = await db.execute(
                select(UsageAlert).filter(
                    UsageAlert.agency_id == agency_id,
                    UsageAlert.alert_type == alert_type,
                    UsageAlert.triggered_at >= datetime.combine(usage.billing_period_start, datetime.min.time())
                )
            )
            existing_alert = alert_result.scalars().first()
            
            if not existing_alert:
                alert = UsageAlert(
                    agency_id=agency_id,
                    alert_type=alert_type,
                    threshold_percentage=threshold
                )
                db.add(alert)
                await db.commit()
                
                # TODO: Send email notification via EmailAutomationService
                logger.warning(f"Usage alert: agency={agency_id}, type={alert_type}, {used}/{limit}")


# Dependencies for routes
async def enforce_cv_parse_limit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Middleware to enforce CV parsing limits"""
    # Only enforce for agency-level users (recruiter, agency_admin)
    if current_user.role.value == 'candidate':
        return  # Candidates might have different limits or none
    
    agency_id = current_user.agency_id
    if not agency_id:
        raise HTTPException(404, "Agency context not found for user")
    
    try:
        usage_info = await check_usage_limit(agency_id, 'cv_parse', db)
        return usage_info
    except UsageLimitError as e:
        raise HTTPException(
            status_code=429,
            detail={
                'error': 'Usage limit exceeded',
                'limit_type': e.limit_type,
                'limit': e.limit,
                'used': e.used,
                'message': f'You have used all {e.limit} CV parses for this month. Upgrade your plan or wait until next month.',
                'upgrade_url': '/clients/settings?tab=billing'
            }
        )


async def enforce_ai_match_limit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Middleware to enforce AI matching limits"""
    agency_id = current_user.agency_id
    if not agency_id:
        return
    
    try:
        usage_info = await check_usage_limit(agency_id, 'ai_match', db)
        return usage_info
    except UsageLimitError as e:
        raise HTTPException(
            status_code=429,
            detail={
                'error': 'Usage limit exceeded',
                'limit_type': e.limit_type,
                'limit': e.limit,
                'used': e.used,
                'message': f'You have used all {e.limit} AI match calculations for this month. Upgrade your plan.',
                'upgrade_url': '/clients/settings?tab=billing'
            }
        )
