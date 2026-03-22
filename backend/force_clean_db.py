
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def run():
    url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url)
    try:
        # Get all tables in public schema
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = \u0027public\u0027")
        for table in tables:
            print(f"Dropping table {table[\u0027table_name\u0027]}...")
            await conn.execute(f"DROP TABLE IF EXISTS \"{table[\u0027table_name\u0027]}\" CASCADE")
        
        # Get all types (enums)
        types = await conn.fetch("SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = \u0027public\u0027 AND t.typtype = \u0027e\u0027")
        for t in types:
            print(f"Dropping type {t[\u0027typname\u0027]}...")
            await conn.execute(f"DROP TYPE IF EXISTS \"{t[\u0027typname\u0027]}\" CASCADE")
            
        print("Database fully cleaned.")
    finally:
        await conn.close()

asyncio.run(run())

