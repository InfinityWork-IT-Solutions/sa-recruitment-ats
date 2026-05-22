"""
CareerPage model — branded public jobs page for each client company
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class CareerPage(Base):
    __tablename__ = "career_pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("client_companies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Public URL slug: /p/{slug}
    slug = Column(String(100), nullable=False, unique=True, index=True)

    # Branding
    headline = Column(String(200), nullable=True)
    tagline = Column(String(500), nullable=True)
    hero_image_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), default="#2563eb", nullable=False)

    # Perks section: [{icon: "heart", title: "Health Benefits", description: "..."}]
    show_perks = Column(Boolean, default=True, nullable=False)
    perks = Column(JSONB, default=list)

    culture_description = Column(Text, nullable=True)

    # SEO
    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(500), nullable=True)

    is_published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = relationship("ClientCompany", back_populates="career_page")
