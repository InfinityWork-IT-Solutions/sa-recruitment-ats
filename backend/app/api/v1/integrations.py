# backend/app/api/v1/integrations.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import User
from app.models.integration import IntegrationConnection

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_integrations(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all integration connections for the company"""
    result = await db.execute(select(IntegrationConnection).filter_by(company_id=current_user.agency_id))
    connections = result.scalars().all()
    
    return [
        {
            "id": str(c.id),
            "platform": c.platform,
            "status": c.status,
            "connected": c.status == 'active',
            "last_sync": c.last_sync_at.isoformat() if c.last_sync_at else None,
            "active_jobs": 0, # Mocked for now
            "total_applications": 0 # Mocked for now
        }
        for c in connections
    ]

@router.post("/{platform}/connect")
async def connect_integration(
    platform: str,
    credentials: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Mock endpoint to connect integration"""
    result = await db.execute(select(IntegrationConnection).filter_by(
        company_id=current_user.agency_id, platform=platform
    ))
    conn = result.scalar_one_or_none()
    
    if not conn:
        conn = IntegrationConnection(company_id=current_user.agency_id, platform=platform)
        db.add(conn)
        
    conn.status = 'active'
    if platform == 'pnet':
        conn.api_key = credentials.get('api_key', 'mock_key')
    elif platform == 'linkedin':
        conn.access_token = credentials.get('access_token', 'mock_token')
        
    await db.commit()
    return {"message": f"Successfully connected to {platform}"}

@router.post("/{platform}/disconnect")
async def disconnect_integration(
    platform: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Disconnect platform"""
    result = await db.execute(select(IntegrationConnection).filter_by(
        company_id=current_user.agency_id, platform=platform
    ))
    conn = result.scalar_one_or_none()
    
    if conn:
        conn.status = 'inactive'
        await db.commit()
        
    return {"message": f"Successfully disconnected from {platform}"}

@router.post("/{platform}/sync")
async def sync_integration(
    platform: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger manual sync"""
    return {"message": f"Sync triggered for {platform}"}
