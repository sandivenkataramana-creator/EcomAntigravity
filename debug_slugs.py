import psycopg2
DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/ecomantigravity"
try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT id, name, slug FROM products LIMIT 20;")
    rows = cur.fetchall()
    print("PRODUCTS:")
    for r in rows:
        print(f" ID: {r[0]}, NAME: {r[1]}, SLUG: {r[2]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
