#!/bin/bash

# RecruitPro SA - Database Creation Script (Bash version)
# Run this BEFORE running Alembic migrations

set -e  # Exit on error

# Load environment variables from .env if it exists
if [ -f .env ]; then
    echo "📝 Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
fi

# Configuration (with defaults)
DB_NAME="${DB_NAME:-recruitpro_sa}"
DB_USER="${DB_USER:-recruitpro_user}"
DB_PASSWORD="${DB_PASSWORD:-recruitpro_password_123}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

echo "🚀 RecruitPro SA - Database Creation"
echo "===================================================="
echo ""
echo "Database Name:     $DB_NAME"
echo "Database User:     $DB_USER"
echo "Database Host:     $DB_HOST"
echo "Database Port:     $DB_PORT"
echo "PostgreSQL User:   $POSTGRES_USER"
echo ""
echo "===================================================="
echo ""

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL connection..."
if ! psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -c '\q' 2>/dev/null; then
    echo "❌ ERROR: Cannot connect to PostgreSQL!"
    echo ""
    echo "PostgreSQL is not running or connection failed."
    echo ""
    echo "To start PostgreSQL:"
    echo "  Ubuntu/Debian:  sudo systemctl start postgresql"
    echo "  macOS:          brew services start postgresql@14"
    echo "  Windows:        net start postgresql-x64-14"
    echo ""
    echo "To check status:"
    echo "  Ubuntu/Debian:  sudo systemctl status postgresql"
    echo "  macOS:          brew services list"
    echo ""
    exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Check if database already exists
echo "🔍 Checking if database exists..."
if psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️  Database '$DB_NAME' already exists!"
    echo ""
    read -p "Drop and recreate database? (yes/no): " -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "🗑️  Dropping existing database..."
        
        # Terminate connections
        psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" <<-EOSQL
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '$DB_NAME'
            AND pid <> pg_backend_pid();
EOSQL
        
        # Drop database and user
        psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" <<-EOSQL
            DROP DATABASE IF EXISTS "$DB_NAME";
            DROP USER IF EXISTS "$DB_USER";
EOSQL
        echo "✅ Existing database dropped"
    else
        echo "❌ Aborting. Database already exists."
        exit 1
    fi
fi
echo ""

# Create database user
echo "👤 Creating database user '$DB_USER'..."
psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" <<-EOSQL
    CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
    ALTER USER "$DB_USER" CREATEDB;
EOSQL
echo "✅ Database user created"
echo ""

# Create database
echo "📦 Creating database '$DB_NAME'..."
psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" <<-EOSQL
    CREATE DATABASE "$DB_NAME"
    WITH OWNER = "$DB_USER"
    ENCODING = 'UTF8';
    
    GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$DB_USER";
EOSQL
echo "✅ Database created"
echo ""

# Enable extensions
echo "🔧 Enabling PostgreSQL extensions..."
psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL
echo "✅ UUID extension enabled"
echo ""

echo "🎉 Database Setup Complete!"
echo "===================================================="
echo ""
echo "Connection String:"
echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Next steps:"
echo "1. Run migrations:     alembic upgrade head"
echo "2. Start application:  uvicorn app.main:app --reload"
echo ""
