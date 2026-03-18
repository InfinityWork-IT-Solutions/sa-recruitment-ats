"""Initial database schema for RecruitPro SA

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-03-18 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create custom enum types
    op.execute("CREATE TYPE userrole AS ENUM ('super_admin', 'agency_admin', 'recruiter', 'hiring_manager')")
    op.execute("CREATE TYPE jobstatus AS ENUM ('draft', 'active', 'paused', 'closed', 'filled', 'expired')")
    op.execute("CREATE TYPE employmenttype AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance')")
    op.execute("CREATE TYPE applicationstatus AS ENUM ('applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_pending', 'offer_made', 'offer_accepted', 'hired', 'rejected', 'withdrawn')")
    op.execute("CREATE TYPE candidatestatus AS ENUM ('active', 'passive', 'placed', 'inactive')")
    
    # Create agencies table
    op.create_table(
        'agencies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('phone', sa.String(50)),
        sa.Column('website', sa.String(255)),
        sa.Column('address', sa.Text),
        sa.Column('city', sa.String(100)),
        sa.Column('province', sa.String(100)),
        sa.Column('country', sa.String(100), server_default='South Africa'),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()'))
    )
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('agency_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', postgresql.ENUM('super_admin', 'agency_admin', 'recruiter', 'hiring_manager', name='userrole'), 
                 nullable=False, server_default='recruiter'),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('is_verified', sa.Boolean, server_default='false'),
        sa.Column('last_login', sa.DateTime),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ondelete='CASCADE')
    )
    op.create_index('idx_users_email', 'users', ['email'])
    
    # Create client_companies table
    op.create_table(
        'client_companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('agency_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('industry', sa.String(100)),
        sa.Column('website', sa.String(255)),
        sa.Column('contact_person', sa.String(255)),
        sa.Column('contact_email', sa.String(255)),
        sa.Column('contact_phone', sa.String(50)),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ondelete='CASCADE')
    )
    
    # Create jobs table
    op.create_table(
        'jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('agency_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_company_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reference', sa.String(50), nullable=False, unique=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('requirements', sa.Text),
        sa.Column('responsibilities', sa.Text),
        sa.Column('benefits', sa.Text),
        sa.Column('employment_type', postgresql.ENUM('full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance', name='employmenttype'), nullable=False),
        sa.Column('experience_level', sa.String(50)),
        sa.Column('skills', postgresql.ARRAY(sa.String)),
        sa.Column('location_city', sa.String(100), nullable=False),
        sa.Column('location_province', sa.String(100), nullable=False),
        sa.Column('location_country', sa.String(100), server_default='South Africa'),
        sa.Column('is_remote', sa.Boolean, server_default='false'),
        sa.Column('salary_min', sa.Float),
        sa.Column('salary_max', sa.Float),
        sa.Column('salary_currency', sa.String(10), server_default='ZAR'),
        sa.Column('status', postgresql.ENUM('draft', 'active', 'paused', 'closed', 'filled', 'expired', name='jobstatus'), 
                 nullable=False, server_default='draft'),
        sa.Column('applications_count', sa.Integer, server_default='0'),
        sa.Column('views_count', sa.Integer, server_default='0'),
        sa.Column('expires_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_company_id'], ['client_companies.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_jobs_reference', 'jobs', ['reference'])
    
    # Create candidates table
    op.create_table(
        'candidates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('agency_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50)),
        sa.Column('city', sa.String(100)),
        sa.Column('province', sa.String(100)),
        sa.Column('country', sa.String(100), server_default='South Africa'),
        sa.Column('current_job_title', sa.String(255)),
        sa.Column('current_company', sa.String(255)),
        sa.Column('years_of_experience', sa.Integer, server_default='0'),
        sa.Column('education_level', sa.String(100)),
        sa.Column('skills', postgresql.ARRAY(sa.String)),
        sa.Column('resume_url', sa.String(500)),
        sa.Column('resume_filename', sa.String(255)),
        sa.Column('resume_parse_data', postgresql.JSON),
        sa.Column('expected_salary_min', sa.Float),
        sa.Column('expected_salary_max', sa.Float),
        sa.Column('salary_currency', sa.String(10), server_default='ZAR'),
        sa.Column('linkedin_url', sa.String(500)),
        sa.Column('source', sa.String(100)),
        sa.Column('status', postgresql.ENUM('active', 'passive', 'placed', 'inactive', name='candidatestatus'), 
                 server_default='active'),
        sa.Column('consent_to_contact', sa.Boolean, server_default='false'),
        sa.Column('consent_date', sa.DateTime),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ondelete='CASCADE')
    )
    op.create_index('idx_candidates_email', 'candidates', ['email'])
    
    # Create applications table
    op.create_table(
        'applications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('candidate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True)),
        sa.Column('status', postgresql.ENUM('applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 
                                          'offer_pending', 'offer_made', 'offer_accepted', 'hired', 'rejected', 'withdrawn', 
                                          name='applicationstatus'), nullable=False, server_default='applied'),
        sa.Column('source', sa.String(100), server_default='direct_application'),
        sa.Column('match_score', sa.Float),
        sa.Column('interview_date', sa.DateTime),
        sa.Column('interview_notes', sa.Text),
        sa.Column('interview_rating', sa.Integer),
        sa.Column('offer_amount', sa.Float),
        sa.Column('offer_currency', sa.String(10), server_default='ZAR'),
        sa.Column('offer_date', sa.DateTime),
        sa.Column('offer_expiry_date', sa.DateTime),
        sa.Column('rejection_reason', sa.Text),
        sa.Column('rejection_date', sa.DateTime),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ondelete='SET NULL')
    )
    
    # Create activities table
    op.create_table(
        'activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_name', sa.String(255), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_name', sa.String(255)),
        sa.Column('metadata', postgresql.JSON),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_activities_created_at', 'activities', ['created_at'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('activities')
    op.drop_table('applications')
    op.drop_table('candidates')
    op.drop_table('jobs')
    op.drop_table('client_companies')
    op.drop_table('users')
    op.drop_table('agencies')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS candidatestatus')
    op.execute('DROP TYPE IF EXISTS applicationstatus')
    op.execute('DROP TYPE IF EXISTS employmenttype')
    op.execute('DROP TYPE IF EXISTS jobstatus')
    op.execute('DROP TYPE IF EXISTS userrole')
