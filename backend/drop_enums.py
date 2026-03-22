import os; import sqlalchemy as sa; from dotenv import load_dotenv;
load_dotenv();
db_url = os.getenv("DATABASE_URL").replace("+asyncpg", "+psycopg2")
engine = sa.create_engine(db_url)
with engine.begin() as conn:
    conn.execute(sa.text("DROP TYPE IF EXISTS userrole CASCADE"))
    conn.execute(sa.text("DROP TYPE IF EXISTS jobstatus CASCADE"))
    conn.execute(sa.text("DROP TYPE IF EXISTS employmenttype CASCADE"))
    conn.execute(sa.text("DROP TYPE IF EXISTS applicationstatus CASCADE"))
    conn.execute(sa.text("DROP TYPE IF EXISTS candidatestatus CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS alembic_version CASCADE"))
print("Dropped types successfully.")

