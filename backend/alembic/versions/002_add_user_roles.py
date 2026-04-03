"""add user roles and multi-tenant support

Revision ID: 002_add_user_roles
Revises: 001_initial_schema
Create Date: 2026-03-23 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '002_add_user_roles'
down_revision = '814251e1731a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create UserRole enum type
    op.execute("""
        CREATE TYPE userrole AS ENUM (
            'candidate',
            'client',
            'recruiter',
            'agency_admin'
        )
    """)
    
    # Add role column to users table (default to agency_admin for existing users)
    op.add_column('users', 
        sa.Column('role', 
                  postgresql.ENUM('candidate', 'client', 'recruiter', 'agency_admin', 
                                  name='userrole', create_type=False),
                  nullable=False,
                  server_default='agency_admin')
    )
    
    # Add company_id column to users table (for client users)
    op.add_column('users', 
        sa.Column('company_id', 
                  postgresql.UUID(as_uuid=True), 
                  nullable=True)
    )
    
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_users_company_id',
        'users', 'client_companies',
        ['company_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # Add seat management columns to client_companies
    op.add_column('client_companies',
        sa.Column('subscription_plan', 
                  sa.String(50), 
                  nullable=False, 
                  server_default='starter')
    )
    
    op.add_column('client_companies',
        sa.Column('included_seats', 
                  sa.Integer(), 
                  nullable=False, 
                  server_default='2')
    )
    
    op.add_column('client_companies',
        sa.Column('additional_seats', 
                  sa.Integer(), 
                  nullable=False, 
                  server_default='0')
    )
    
    op.add_column('client_companies',
        sa.Column('is_active', 
                  sa.Boolean(), 
                  nullable=False, 
                  server_default='true')
    )
    
    # Add indexes for better query performance
    op.create_index('idx_users_role', 'users', ['role'])
    op.create_index('idx_users_company_id', 'users', ['company_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_users_company_id')
    op.drop_index('idx_users_role')
    
    # Drop columns from client_companies
    op.drop_column('client_companies', 'is_active')
    op.drop_column('client_companies', 'additional_seats')
    op.drop_column('client_companies', 'included_seats')
    op.drop_column('client_companies', 'subscription_plan')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_users_company_id', 'users', type_='foreignkey')
    
    # Drop columns from users
    op.drop_column('users', 'company_id')
    op.drop_column('users', 'role')
    
    # Drop enum type
    op.execute('DROP TYPE userrole')
