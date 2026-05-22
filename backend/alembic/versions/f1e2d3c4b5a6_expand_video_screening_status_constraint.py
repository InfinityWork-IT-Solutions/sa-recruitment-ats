"""expand video screening invitation status constraint

Revision ID: f1e2d3c4b5a6
Revises: e3f1a2b4c5d6
Create Date: 2026-05-22 15:30:00.000000

"""
from alembic import op

revision = 'f1e2d3c4b5a6'
down_revision = 'e3f1a2b4c5d6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint('video_screening_invitations_status_check', 'video_screening_invitations', type_='check')
    op.create_check_constraint(
        'video_screening_invitations_status_check',
        'video_screening_invitations',
        "status IN ('pending', 'in_progress', 'completed', 'expired', 'withdrawn', 'reviewed', 'approved', 'rejected')"
    )


def downgrade() -> None:
    op.drop_constraint('video_screening_invitations_status_check', 'video_screening_invitations', type_='check')
    op.create_check_constraint(
        'video_screening_invitations_status_check',
        'video_screening_invitations',
        "status IN ('pending', 'in_progress', 'completed', 'expired', 'withdrawn')"
    )
