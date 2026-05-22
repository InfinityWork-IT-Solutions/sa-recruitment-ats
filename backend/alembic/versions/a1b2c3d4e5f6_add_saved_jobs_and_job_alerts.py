"""add saved_jobs and job_alerts tables

Revision ID: a1b2c3d4e5f6
Revises: f1e2d3c4b5a6
Create Date: 2026-05-22 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'a1b2c3d4e5f6'
down_revision = 'f1e2d3c4b5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'saved_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=sa.text('gen_random_uuid()')),
        sa.Column('candidate_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('saved_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['candidate_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('candidate_user_id', 'job_id', name='uq_saved_job'),
    )
    op.create_index('ix_saved_jobs_candidate_user_id', 'saved_jobs', ['candidate_user_id'])
    op.create_index('ix_saved_jobs_job_id', 'saved_jobs', ['job_id'])

    op.create_table(
        'job_alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=sa.text('gen_random_uuid()')),
        sa.Column('candidate_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('keywords', sa.String(500), nullable=True),
        sa.Column('location', sa.String(200), nullable=True),
        sa.Column('employment_type', sa.String(50), nullable=True),
        sa.Column('salary_min', sa.Integer(), nullable=True),
        sa.Column('frequency', sa.String(20), nullable=False, server_default='daily'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['candidate_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_job_alerts_candidate_user_id', 'job_alerts', ['candidate_user_id'])


def downgrade() -> None:
    op.drop_index('ix_job_alerts_candidate_user_id', 'job_alerts')
    op.drop_table('job_alerts')
    op.drop_index('ix_saved_jobs_job_id', 'saved_jobs')
    op.drop_index('ix_saved_jobs_candidate_user_id', 'saved_jobs')
    op.drop_table('saved_jobs')
