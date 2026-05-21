from sqlalchemy import Column, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # In-app notification toggles
    inapp_new_application = Column(Boolean, default=True)      # recruiter/client: someone applied
    inapp_application_status = Column(Boolean, default=True)   # candidate: their app moved stages
    inapp_ai_match = Column(Boolean, default=True)             # client: top candidate found; candidate: job match
    inapp_interview = Column(Boolean, default=True)            # candidate: interview scheduled
    inapp_offer = Column(Boolean, default=True)                # candidate: offer received
    inapp_billing = Column(Boolean, default=True)              # client/admin: billing events
    inapp_system = Column(Boolean, default=True)               # all: system announcements

    # Email notification toggles
    email_new_application = Column(Boolean, default=True)
    email_application_status = Column(Boolean, default=True)
    email_ai_match = Column(Boolean, default=True)
    email_interview = Column(Boolean, default=True)
    email_offer = Column(Boolean, default=True)
    email_billing = Column(Boolean, default=True)
    email_system = Column(Boolean, default=False)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="notification_preference", uselist=False)

    def __repr__(self):
        return f"<NotificationPreference user={self.user_id}>"
