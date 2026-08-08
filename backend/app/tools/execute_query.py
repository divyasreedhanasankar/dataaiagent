import sqlite3
import time
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[2] / "database" / "ecommerce.db"

# Maximum rows to return (safety limit)
MAX_ROWS = 500


def execute_query(query: str):
    """
    Execute a read-only SQL query against the ecommerce SQLite database.

    Only SELECT and WITH queries are allowed.
    Returns results as a list of dictionaries with column names and timing.
    """

    query = query.strip()

    # Security: only allow read-only queries
    if not (
        query.upper().startswith("SELECT")
        or query.upper().startswith("WITH")
    ):
        return {
            "success": False,
            "error": "Only SELECT and WITH queries are allowed.",
            "columns": [],
            "data": [],
            "row_count": 0,
            "execution_time_ms": 0,
        }

    # Prevent multiple SQL statements
    if ";" in query[:-1]:
        return {
            "success": False,
            "error": "Multiple SQL statements are not allowed.",
            "columns": [],
            "data": [],
            "row_count": 0,
            "execution_time_ms": 0,
        }

    try:
        start = time.perf_counter()

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row

        cursor = conn.cursor()
        cursor.execute(query)

        rows = cursor.fetchall()

        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

        # Get column names from cursor description
        columns = [desc[0] for desc in cursor.description] if cursor.description else []

        # Convert to list of dicts
        results = [dict(row) for row in rows]

        # Get total count before limiting
        total_count = len(results)

        # Limit rows for safety
        if len(results) > MAX_ROWS:
            results = results[:MAX_ROWS]

        conn.close()

        return {
            "success": True,
            "columns": columns,
            "row_count": total_count,
            "data": results,
            "execution_time_ms": elapsed_ms,
        }

    except sqlite3.Error as e:
        return {
            "success": False,
            "error": str(e),
            "columns": [],
            "data": [],
            "row_count": 0,
            "execution_time_ms": 0,
        }