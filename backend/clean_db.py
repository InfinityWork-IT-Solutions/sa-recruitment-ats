import os, sqlalchemy as sa; from dotenv import load_dotenv;
load_dotenv();
db_url = os.getenv("DATABASE_URL").replace("+asyncpg", "+psycopg2")
engine = sa.create_engine(db_url)
metadata = sa.MetaData()
try:
    metadata.reflect(bind=engine)
    with engine.begin() as conn:
        metadata.drop_all(conn)
        conn.execute(sa.text("DROP TYPE IF EXISTS userrole CASCADE"))
        conn.execute(sa.text("DROP TYPE IF EXISTS jobstatus CASCADE"))
        conn.execute(sa.text("DROP TYPE IF EXISTS employmenttype CASCADE"))
        conn.execute(sa.text("DROP TYPE IF EXISTS applicationstatus CASCADE"))
        conn.execute(sa.text("DROP TYPE IF EXISTS candidatestatus CASCADE"))
        print("Cleaned up all tables and enums successfully.")
except Exception as e:
    print(f"Error dropping types: {e}")

