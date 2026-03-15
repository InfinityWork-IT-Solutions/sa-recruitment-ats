"""
Analytics API endpoints - Dashboard metrics and reports
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_metrics(
    period_days: int = Query(30, ge=1, le=365, description="Period in days"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard overview metrics
    
    **Metrics included**:
    - Total jobs, active jobs
    - Total candidates, active candidates
    - Applications this period
    - Placements
    - Average time to hire
    - Success rate
    """
    metrics = await analytics_service.get_dashboard_overview(
        db,
        current_user.agency_id,
        period_days
    )
    
    return metrics


@router.get("/applications-over-time")
async def get_applications_chart_data(
    period_days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get applications count over time (for line chart)
    
    **Returns**: Daily application counts
    """
    data = await analytics_service.get_applications_over_time(
        db,
        current_user.agency_id,
        period_days
    )
    
    return {"data": data, "period_days": period_days}


@router.get("/applications-by-status")
async def get_applications_distribution(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get applications distribution by status (for pie chart)
    
    **Returns**: Count per status
    """
    data = await analytics_service.get_applications_by_status(
        db,
        current_user.agency_id
    )
    
    return {"data": data}


@router.get("/top-jobs")
async def get_top_performing_jobs(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get top performing jobs by applications and hires
    
    **Returns**: Jobs with application counts and conversion rates
    """
    jobs = await analytics_service.get_top_performing_jobs(
        db,
        current_user.agency_id,
        limit
    )
    
    return {"jobs": jobs}


@router.get("/recruiter-performance")
async def get_recruiter_performance(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recruiter performance metrics
    
    **Returns**: Performance stats per recruiter
    """
    performance = await analytics_service.get_recruiter_performance(
        db,
        current_user.agency_id
    )
    
    return {"recruiters": performance}


@router.get("/source-effectiveness")
async def get_source_effectiveness(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get candidate source effectiveness
    
    **Returns**: Conversion rates by source (LinkedIn, referral, etc.)
    """
    sources = await analytics_service.get_source_effectiveness(
        db,
        current_user.agency_id
    )
    
    return {"sources": sources}


@router.get("/export/applications/csv")
async def export_applications_csv(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export applications to CSV
    
    **Returns**: CSV file
    """
    from app.models.application import ApplicationStatus
    
    filters = {}
    if status:
        filters['status'] = ApplicationStatus(status)
    
    csv_data = await analytics_service.export_applications_to_csv(
        db,
        current_user.agency_id,
        filters
    )
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=applications_{current_user.agency_id}.csv"
        }
    )


@router.get("/export/candidates/excel")
async def export_candidates_excel(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export candidates to Excel with formatting
    
    **Returns**: Excel file (.xlsx)
    """
    excel_data = await analytics_service.export_candidates_to_excel(
        db,
        current_user.agency_id
    )
    
    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=candidates_{current_user.agency_id}.xlsx"
        }
    )
