
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any

class MessageTemplateBase(BaseModel):
    name: str
    template_type: str
    subject: Optional[str] = None
    body_template: str
    is_active: bool = True
    is_default: bool = False

class MessageTemplateCreate(MessageTemplateBase):
    company_id: Optional[UUID] = None

class MessageTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_template: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class MessageTemplateResponse(MessageTemplateBase):
    id: UUID
    agency_id: UUID
    company_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EmailPreviewRequest(BaseModel):
    template_id: UUID
    variables: Dict[str, Any]

class EmailPreviewResponse(BaseModel):
    subject: str
    body: str
