from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class NotificationPreferenceResponse(BaseModel):
    id: UUID
    user_id: UUID

    inapp_new_application: bool
    inapp_application_status: bool
    inapp_ai_match: bool
    inapp_interview: bool
    inapp_offer: bool
    inapp_billing: bool
    inapp_system: bool

    email_new_application: bool
    email_application_status: bool
    email_ai_match: bool
    email_interview: bool
    email_offer: bool
    email_billing: bool
    email_system: bool

    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationPreferenceUpdate(BaseModel):
    inapp_new_application: Optional[bool] = None
    inapp_application_status: Optional[bool] = None
    inapp_ai_match: Optional[bool] = None
    inapp_interview: Optional[bool] = None
    inapp_offer: Optional[bool] = None
    inapp_billing: Optional[bool] = None
    inapp_system: Optional[bool] = None

    email_new_application: Optional[bool] = None
    email_application_status: Optional[bool] = None
    email_ai_match: Optional[bool] = None
    email_interview: Optional[bool] = None
    email_offer: Optional[bool] = None
    email_billing: Optional[bool] = None
    email_system: Optional[bool] = None
