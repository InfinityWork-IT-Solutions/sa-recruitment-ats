#!/bin/bash

# RecruitPro SA - Database Creation Script
# This script creates the PostgreSQL database for RecruitPro SA

set -e  # Exit on error

# Configuration
DB_NAME="${DB_NAME:-recruitpro_sa}"
DB_USER="${DB_USER:-recruitpro_user}"
DB_PASSWORD="${DB_PASSWORD:-recruitpro_password_123}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

echo "🚀 RecruitPro SA - Database Setup"
echo "=================================="
echo ""
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo ""

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL connection..."
if ! psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT"
    echo "Please ensure PostgreSQL is running and accessible."
    exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Check if database already exists
echo "🔍 Checking if database exists..."
if psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️  Database '$DB_NAME' already exists!"
    read -p "Do you want to drop and recreate it? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "🗑️  Dropping existing database..."
        psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -c "DROP USER IF EXISTS $DB_USER;"
        echo "✅ Existing database dropped"
    else
        echo "❌ Aborting. Database already exists."
        exit 1
    fi
fi
echo ""

# Create database user
echo "👤 Creating database user..."
psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" <<-EOSQL
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    ALTER USER $DB_USER CREATEDB;
EOSQL
echo "✅ Database user created"
echo ""

# Create database
echo "📦 Creating database..."
psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" <<-EOSQL
    CREATE DATABASE $DB_NAME WITH OWNER $DB_USER;
    GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOSQL
echo "✅ Database created"
echo ""

# Enable UUID extension
echo "🔧 Enabling UUID extension..."
psql -U "$POSTGRES_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL
echo "✅ UUID extension enabled"
echo ""

# Create .env file
echo "📝 Creating .env file..."
cat > .env <<EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

# Application Configuration
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
EOF
echo "✅ .env file created"
echo ""

echo "🎉 Database Setup Complete!"
echo "=========================="
echo ""
echo "Database URL: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Next steps:"
echo "1. Install dependencies: pip install -r requirements.txt"
echo "2. Run migrations: alembic upgrade head"
echo "3. Start the application: uvicorn app.main:app --reload"
echo ""
