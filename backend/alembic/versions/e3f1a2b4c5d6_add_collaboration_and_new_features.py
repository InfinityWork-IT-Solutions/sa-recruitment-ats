"""add collaboration and new features

Revision ID: e3f1a2b4c5d6
Revises: a9f8e7d6c5b4
Create Date: 2026-05-21 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'e3f1a2b4c5d6'
down_revision = 'a9f8e7d6c5b4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # Create ENUMs first (checkfirst=True avoids DuplicateObject if already present)
    scorecard_recommendation = postgresql.ENUM(
        'strong_hire', 'hire', 'maybe', 'no_hire',
        name='scorecardrecommendation'
    )
    scorecard_recommendation.create(bind, checkfirst=True)

    checklist_category = postgresql.ENUM(
        'documents', 'access', 'equipment', 'hr', 'other',
        name='checklistitemcategory'
    )
    checklist_category.create(bind, checkfirst=True)

    search_type_enum = postgresql.ENUM(
        'candidates', 'jobs', 'applications',
        name='searchtype'
    )
    search_type_enum.create(bind, checkfirst=True)

    trigger_event_enum = postgresql.ENUM(
        'application_received', 'shortlisted', 'after_interview', 'offer_made', 'rejected',
        name='sequencetriggerevent'
    )
    trigger_event_enum.create(bind, checkfirst=True)

    # --- application_comments ---
    op.create_table(
        'application_comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('mentioned_user_ids', postgresql.JSONB, nullable=True, server_default='[]'),
        sa.Column('is_internal', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_application_comments_application_id', 'application_comments', ['application_id'])
    op.create_index('ix_application_comments_user_id', 'application_comments', ['user_id'])

    # --- interview_scorecards ---
    op.create_table(
        'interview_scorecards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('interview_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('scheduled_interviews.id', ondelete='CASCADE'), nullable=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scored_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('overall_rating', sa.Integer, nullable=False),
        sa.Column('criteria_scores', postgresql.JSONB, nullable=True, server_default='{}'),
        sa.Column('strengths', sa.Text, nullable=True),
        sa.Column('concerns', sa.Text, nullable=True),
        sa.Column('recommendation', postgresql.ENUM('strong_hire', 'hire', 'maybe', 'no_hire', name='scorecardrecommendation', create_type=False), nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_interview_scorecards_application_id', 'interview_scorecards', ['application_id'])
    op.create_index('ix_interview_scorecards_interview_id', 'interview_scorecards', ['interview_id'])

    # --- onboarding_checklists ---
    op.create_table(
        'onboarding_checklists',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_onboarding_checklists_application_id', 'onboarding_checklists', ['application_id'])

    # --- onboarding_checklist_items ---
    op.create_table(
        'onboarding_checklist_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('checklist_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('onboarding_checklists.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('due_date', sa.DateTime, nullable=True),
        sa.Column('is_completed', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('completed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('order_index', sa.Integer, nullable=False, server_default='0'),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('category', postgresql.ENUM('documents', 'access', 'equipment', 'hr', 'other', name='checklistitemcategory', create_type=False), nullable=False, server_default='other'),
    )
    op.create_index('ix_onboarding_checklist_items_checklist_id', 'onboarding_checklist_items', ['checklist_id'])

    # --- career_pages ---
    op.create_table(
        'career_pages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('client_companies.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('headline', sa.String(200), nullable=True),
        sa.Column('tagline', sa.String(500), nullable=True),
        sa.Column('hero_image_url', sa.String(500), nullable=True),
        sa.Column('primary_color', sa.String(7), nullable=False, server_default='#2563eb'),
        sa.Column('show_perks', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('perks', postgresql.JSONB, nullable=True, server_default='[]'),
        sa.Column('culture_description', sa.Text, nullable=True),
        sa.Column('seo_title', sa.String(200), nullable=True),
        sa.Column('seo_description', sa.String(500), nullable=True),
        sa.Column('is_published', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_career_pages_company_id', 'career_pages', ['company_id'])
    op.create_index('ix_career_pages_slug', 'career_pages', ['slug'])

    # --- saved_searches ---
    op.create_table(
        'saved_searches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('search_type', postgresql.ENUM('candidates', 'jobs', 'applications', name='searchtype', create_type=False), nullable=False),
        sa.Column('filters', postgresql.JSONB, nullable=True, server_default='{}'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_saved_searches_user_id', 'saved_searches', ['user_id'])

    # --- email_sequences ---
    op.create_table(
        'email_sequences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('client_companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('trigger_event', postgresql.ENUM('application_received', 'shortlisted', 'after_interview', 'offer_made', 'rejected', name='sequencetriggerevent', create_type=False), nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_email_sequences_company_id', 'email_sequences', ['company_id'])

    # --- email_sequence_steps ---
    op.create_table(
        'email_sequence_steps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('sequence_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('email_sequences.id', ondelete='CASCADE'), nullable=False),
        sa.Column('step_number', sa.Integer, nullable=False),
        sa.Column('delay_hours', sa.Integer, nullable=False, server_default='0'),
        sa.Column('subject', sa.String(300), nullable=False),
        sa.Column('body_template', sa.Text, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_email_sequence_steps_sequence_id', 'email_sequence_steps', ['sequence_id'])

    # --- email_sequence_enrollments ---
    op.create_table(
        'email_sequence_enrollments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('sequence_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('email_sequences.id', ondelete='CASCADE'), nullable=False),
        sa.Column('candidate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=True),
        sa.Column('current_step', sa.Integer, nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('next_send_at', sa.DateTime, nullable=True),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_email_sequence_enrollments_sequence_id', 'email_sequence_enrollments', ['sequence_id'])
    op.create_index('ix_email_sequence_enrollments_candidate_id', 'email_sequence_enrollments', ['candidate_id'])
    op.create_index('ix_email_sequence_enrollments_next_send_at', 'email_sequence_enrollments', ['next_send_at'])

    # --- jobs: add is_template column ---
    op.add_column('jobs', sa.Column('is_template', sa.Boolean, nullable=False, server_default='false'))
    op.create_index('ix_jobs_is_template', 'jobs', ['is_template'])


def downgrade() -> None:
    op.drop_index('ix_jobs_is_template', 'jobs')
    op.drop_column('jobs', 'is_template')

    op.drop_table('email_sequence_enrollments')
    op.drop_table('email_sequence_steps')
    op.drop_table('email_sequences')
    op.drop_table('saved_searches')
    op.drop_table('career_pages')
    op.drop_table('onboarding_checklist_items')
    op.drop_table('onboarding_checklists')
    op.drop_table('interview_scorecards')
    op.drop_table('application_comments')

    op.execute('DROP TYPE IF EXISTS sequencetriggerevent')
    op.execute('DROP TYPE IF EXISTS searchtype')
    op.execute('DROP TYPE IF EXISTS checklistitemcategory')
    op.execute('DROP TYPE IF EXISTS scorecardrecommendation')
