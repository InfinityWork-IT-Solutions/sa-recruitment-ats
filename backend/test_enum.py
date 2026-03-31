import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect("postgresql://recruitpro_user:recruitpro_password_123@127.0.0.1:5432/recruitpro_sa")
    
    try:
        await conn.execute("ALTER TYPE userrole ADD VALUE 'candidate';")
        print("Added 'candidate' to userrole enum.")
    except asyncpg.exceptions.DuplicateObjectError:
        print("'candidate' already in enum.")
        
    try:
        await conn.execute("ALTER TYPE userrole ADD VALUE 'client';")
        print("Added 'client' to userrole enum.")
    except asyncpg.exceptions.DuplicateObjectError:
        print("'client' already in enum.")
        
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
