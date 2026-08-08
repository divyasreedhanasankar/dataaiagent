import sqlite3
from pathlib import Path

db = Path("database/ecommerce.db")
print(f"DB exists: {db.exists()}, size: {db.stat().st_size / 1024 / 1024:.1f} MB")

conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print(f"Tables ({len(tables)}):", tables)

for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM '{t}'")
    count = cur.fetchone()[0]
    print(f"  {t}: {count} rows")

conn.close()
print("\nDatabase connection: OK ✅")
