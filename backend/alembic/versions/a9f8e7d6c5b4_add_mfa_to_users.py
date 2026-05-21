"""add mfa to users

Revision ID: a9f8e7d6c5b4
Revises: b01f94574311
Create Date: 2026-05-21 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a9f8e7d6c5b4'
down_revision = 'b01f94574311'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('mfa_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('mfa_secret', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'mfa_secret')
    op.drop_column('users', 'mfa_enabled')
