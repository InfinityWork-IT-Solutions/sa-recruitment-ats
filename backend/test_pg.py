import psycopg2;
try:
    conn = psycopg2.connect("host=localhost port=5432 user=postgres dbname=recruitpro_sa")
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("GRANT ALL ON SCHEMA public TO recruitpro_user;")
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")

