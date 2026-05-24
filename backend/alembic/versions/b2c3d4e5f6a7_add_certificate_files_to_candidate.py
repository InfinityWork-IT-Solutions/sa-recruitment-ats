"""add_certificate_files_to_candidate

Revision ID: b2c3d4e5f6a7
Revises: ef46b50a58bd
Create Date: 2026-05-24 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'b2c3d4e5f6a7'
down_revision = 'ef46b50a58bd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'candidates',
        sa.Column('certificate_files', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('candidates', 'certificate_files')
