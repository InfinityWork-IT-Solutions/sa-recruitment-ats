-- RecruitPro SA - Database Creation SQL
-- Execute this file to create the database and user
-- 
-- Usage: 
--   psql -U postgres -f create_database.sql
--   or
--   sudo -u postgres psql -f create_database.sql

-- Create the database user
CREATE USER recruitpro_user WITH PASSWORD 'recruitpro_password_123';
ALTER USER recruitpro_user CREATEDB;

-- Create the database
CREATE DATABASE recruitpro_sa 
    WITH OWNER = recruitpro_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE recruitpro_sa TO recruitpro_user;

-- Connect to the new database
\c recruitpro_sa

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify setup
\echo ''
\echo '✅ Database created successfully!'
\echo ''
\echo 'Database: recruitpro_sa'
\echo 'User: recruitpro_user'
\echo 'Password: recruitpro_password_123'
\echo ''
\echo 'Connection string:'
\echo 'postgresql://recruitpro_user:recruitpro_password_123@localhost:5432/recruitpro_sa'
\echo ''
\echo 'Next steps:'
\echo '1. Run migrations: alembic upgrade head'
\echo '2. Start server: uvicorn app.main:app --reload'
\echo ''
