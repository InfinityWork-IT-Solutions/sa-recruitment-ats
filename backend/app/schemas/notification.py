
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"  # info, success, warning, error, application, billing
    link: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationUpdate(BaseModel):
    is_read: bool

class NotificationResponse(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int
