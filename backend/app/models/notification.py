
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    message = Column(String, nullable=False)
    type = Column(String(50), nullable=False)  # 'info', 'success', 'warning', 'error', 'application', 'billing'
    
    is_read = Column(Boolean, default=False)
    link = Column(String)  # Optional URL to navigate to when clicked
    
    # Metadata for additional context (e.g., application_id, invoice_id)
    metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", backref="notifications")

    def __repr__(self):
        return f"<Notification {self.title} for User {self.user_id}>"
