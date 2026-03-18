"""
RecruitPro SA - Database Creation Script
Run this BEFORE running Alembic migrations
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import os
from pathlib import Path

# Add parent directory to path to import settings
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from app.core.config import settings
    
    # Parse database URL to get components
    db_url = settings.DATABASE_URL
    # Handle both postgresql:// and postgresql+asyncpg://
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')
    
    # Extract database name from URL
    # Format: postgresql://user:password@host:port/database
    db_name = db_url.split('/')[-1]
    base_url = '/'.join(db_url.split('/')[:-1])
    
    # Extract connection details
    from urllib.parse import urlparse
    parsed = urlparse(db_url)
    
    DB_USER = parsed.username
    DB_PASSWORD = parsed.password
    DB_HOST = parsed.hostname
    DB_PORT = parsed.port or 5432
    DB_NAME = parsed.path.lstrip('/')
    
except ImportError:
    # Fallback to environment variables if settings not available
    DB_NAME = os.getenv('DB_NAME', 'recruitpro_sa')
    DB_USER = os.getenv('DB_USER', 'recruitpro_user')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'recruitpro_password_123')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')

POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')


def create_database():
    """Create the database if it doesn't exist"""
    print("🚀 RecruitPro SA - Database Creation")
    print("=" * 50)
    print(f"Database Name: {DB_NAME}")
    print(f"Database User: {DB_USER}")
    print(f"Database Host: {DB_HOST}")
    print(f"Database Port: {DB_PORT}")
    print("=" * 50)
    print()
    
    try:
        # Connect to PostgreSQL server (not to a specific database)
        print("📊 Connecting to PostgreSQL server...")
        
        # Build connection string for postgres database
        conn_string = f"host={DB_HOST} port={DB_PORT} user={POSTGRES_USER} dbname=postgres"
        if POSTGRES_PASSWORD:
            conn_string += f" password={POSTGRES_PASSWORD}"
        
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to PostgreSQL server")
        print()
        
        # Check if database exists
        print("🔍 Checking if database exists...")
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_NAME,)
        )
        exists = cursor.fetchone()
        
        if exists:
            print(f"⚠️  Database '{DB_NAME}' already exists!")
            response = input("Do you want to drop and recreate it? (yes/no): ").strip().lower()
            
            if response == 'yes':
                print(f"🗑️  Dropping database '{DB_NAME}'...")
                
                # Terminate existing connections
                cursor.execute(f"""
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '{DB_NAME}'
                    AND pid <> pg_backend_pid()
                """)
                
                # Drop database
                cursor.execute(f'DROP DATABASE IF EXISTS "{DB_NAME}"')
                print("✅ Database dropped")
                
                # Drop user if exists
                print(f"🗑️  Dropping user '{DB_USER}'...")
                cursor.execute(f'DROP USER IF EXISTS "{DB_USER}"')
                print("✅ User dropped")
            else:
                print("❌ Aborting. Database already exists.")
                cursor.close()
                conn.close()
                return False
        
        # Create database user
        print()
        print(f"👤 Creating database user '{DB_USER}'...")
        try:
            cursor.execute(f"""
                CREATE USER "{DB_USER}" WITH PASSWORD '{DB_PASSWORD}'
            """)
            print("✅ Database user created")
        except psycopg2.errors.DuplicateObject:
            print("⚠️  User already exists, skipping...")
        
        # Grant createdb privilege
        cursor.execute(f'ALTER USER "{DB_USER}" CREATEDB')
        
        # Create database
        print()
        print(f"📦 Creating database '{DB_NAME}'...")
        cursor.execute(f"""
            CREATE DATABASE "{DB_NAME}"
            WITH OWNER = "{DB_USER}"
            ENCODING = 'UTF8'
        """)
        print("✅ Database created")
        
        # Grant privileges
        print()
        print("🔐 Granting privileges...")
        cursor.execute(f'GRANT ALL PRIVILEGES ON DATABASE "{DB_NAME}" TO "{DB_USER}"')
        print("✅ Privileges granted")
        
        # Close connection to postgres database
        cursor.close()
        conn.close()
        
        # Connect to the new database to enable extensions
        print()
        print("🔧 Enabling extensions...")
        conn_string = f"host={DB_HOST} port={DB_PORT} user={POSTGRES_USER} dbname={DB_NAME}"
        if POSTGRES_PASSWORD:
            conn_string += f" password={POSTGRES_PASSWORD}"
        
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Enable UUID extension
        cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        print("✅ UUID extension enabled")
        
        cursor.close()
        conn.close()
        
        print()
        print("🎉 Database Setup Complete!")
        print("=" * 50)
        print()
        print("Next steps:")
        print("1. Run migrations: alembic upgrade head")
        print("2. Start the application: uvicorn app.main:app --reload")
        print()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database Error: {e}")
        print()
        print("Common issues:")
        print("1. PostgreSQL is not running")
        print("2. Wrong postgres user password")
        print("3. Insufficient permissions")
        print()
        print("Try:")
        print(f"  - Start PostgreSQL: sudo systemctl start postgresql")
        print(f"  - Check PostgreSQL status: sudo systemctl status postgresql")
        print(f"  - Connect manually: psql -U postgres")
        return False
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    success = create_database()
    sys.exit(0 if success else 1)
