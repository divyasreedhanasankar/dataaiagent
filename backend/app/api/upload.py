# =============================================================================
# HOW TO RUN THIS MODULE
# =============================================================================
#
# This file is part of the DataMind AI backend (FastAPI application).
# It is NOT run directly — it is loaded automatically by the FastAPI app.
#
# STEP 1 — Install Python dependencies (run once):
#   cd backend
#   pip install -r requirements.txt
#
# STEP 2 — Start the backend server:
#   cd backend
#   uvicorn main:app --reload --port 8000
#
# STEP 3 — Start the frontend dev server (in a separate terminal):
#   cd <project-root>
#   npm install        # run once
#   npm run dev        # starts Vite on http://localhost:5173
#
# API ENDPOINTS PROVIDED BY THIS FILE:
#   POST   /api/upload              → Upload a CSV or Excel file as a SQLite table
#   GET    /api/datasets            → List all tables in the database
#   DELETE /api/datasets/{name}     → Delete an uploaded dataset table
#
# SUPPORTED FILE TYPES:   .csv  |  .xlsx  |  .xls
# MAX FILE SIZE:           50 MB
# DATABASE:                backend/database/ecommerce.db  (SQLite)
#
# TESTING ENDPOINTS (after server is running):
#   curl -X POST http://localhost:8000/api/upload -F "file=@yourfile.csv"
#   curl http://localhost:8000/api/datasets
#   curl -X DELETE http://localhost:8000/api/datasets/your_table_name
#   OR open http://localhost:8000/docs  for the interactive Swagger UI
# =============================================================================

import os
import sqlite3
import csv
import io
import tempfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException


# Path to the SQLite database file (resolved relative to this file's location)
DB_PATH = Path(__file__).resolve().parents[2] / "database" / "ecommerce.db"

# FastAPI router — registered in main.py under the /api prefix
router = APIRouter()


# Allowed file extensions for upload
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
# Maximum allowed upload size (50 MB)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def sanitize_table_name(name: str) -> str:
    """
    Create a safe SQLite table name from a filename.

    - Strips the file extension
    - Replaces non-alphanumeric characters with underscores
    - Converts to lowercase
    - Ensures it doesn't start with a digit
    - Truncates to 64 characters
    """
    base = Path(name).stem
    safe = "".join(c if c.isalnum() or c == "_" else "_" for c in base)
    safe = safe.strip("_").lower()
    if not safe or safe[0].isdigit():
        safe = f"t_{safe}"
    return safe[:64]


def get_column_types(values: list) -> str:
    """
    Infer the SQLite column type (INTEGER, REAL, or TEXT) from a list of
    sample string values. Tries INTEGER first, then REAL, then falls back
    to TEXT.
    """
    for v in values:
        if v is None or v == "":
            continue
        try:
            int(v)
            return "INTEGER"
        except (ValueError, TypeError):
            pass
        try:
            float(v)
            return "REAL"
        except (ValueError, TypeError):
            pass
    return "TEXT"


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file and import it as a new SQLite table.

    - Validates file extension and size
    - Parses headers and rows from the file
    - Creates (or replaces) a table in the SQLite database
    - Returns a preview of the first 5 rows

    Request (multipart/form-data):
        file: the CSV / .xlsx / .xls file to upload

    Response JSON:
        {
            "success": true,
            "table_name": "my_dataset",
            "original_filename": "my_dataset.csv",
            "row_count": 1200,
            "column_count": 8,
            "columns": ["id", "name", ...],
            "preview": [{...}, ...]
        }
    """

    # Ensure a filename was provided
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Check that the extension is supported
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: .csv, .xlsx, .xls"
        )

    # Read the full file content into memory and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)} MB"
        )

    # Derive a safe SQLite table name from the original filename
    table_name = sanitize_table_name(file.filename)

    try:
        # Parse the file based on its extension
        if ext == ".csv":
            rows, headers = _parse_csv(content)
        else:
            rows, headers = _parse_excel(content, ext)

        # Reject empty files
        if not headers or not rows:
            raise HTTPException(status_code=400, detail="File is empty or has no data")

        # Import the parsed data into the SQLite database
        _import_to_sqlite(table_name, headers, rows)

        # Build a preview of the first 5 rows as a list of dicts
        preview_rows = rows[:5]
        preview = [dict(zip(headers, row)) for row in preview_rows]

        return {
            "success": True,
            "table_name": table_name,
            "original_filename": file.filename,
            "row_count": len(rows),
            "column_count": len(headers),
            "columns": headers,
            "preview": preview,
        }

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@router.get("/datasets")
def list_datasets():
    """
    List all tables currently in the SQLite database along with their
    row count and column definitions.

    Response JSON:
        {
            "success": true,
            "datasets": [
                {
                    "table_name": "orders",
                    "row_count": 500,
                    "column_count": 6,
                    "columns": [{"name": "id", "type": "INTEGER"}, ...]
                },
                ...
            ]
        }
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Fetch all table names from the SQLite catalog
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table'
            ORDER BY name;
        """)
        tables = cursor.fetchall()

        datasets = []
        for (table_name,) in tables:
            # Count total rows in the table
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            row_count = cursor.fetchone()[0]

            # Fetch column metadata via PRAGMA
            cursor.execute(f'PRAGMA table_info("{table_name}")')
            columns = cursor.fetchall()
            column_info = [
                {"name": col[1], "type": col[2]}
                for col in columns
            ]

            datasets.append({
                "table_name": table_name,
                "row_count": row_count,
                "column_count": len(column_info),
                "columns": column_info,
            })

        conn.close()
        return {"success": True, "datasets": datasets}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/datasets/{table_name}")
def delete_dataset(table_name: str):
    """
    Delete an uploaded dataset table from the database by name.

    Core tables (customers, orders, products, etc.) are protected and
    cannot be deleted through this endpoint.

    Path parameter:
        table_name: the name of the table to drop

    Response JSON:
        {"success": true, "message": "Table 'my_dataset' deleted"}
    """
    # Sanitize the incoming table name to prevent SQL injection
    safe_name = sanitize_table_name(table_name)

    # Protect built-in core tables from accidental deletion
    core_tables = {
        "customers", "orders", "products", "order_items",
        "payments", "reviews", "sellers", "geolocation",
        "category_translation"
    }
    if safe_name in core_tables:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete core database tables"
        )

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f'DROP TABLE IF EXISTS "{safe_name}"')
        conn.commit()
        conn.close()
        return {"success": True, "message": f"Table '{safe_name}' deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# INTERNAL HELPERS
# =============================================================================

def _parse_csv(content: bytes) -> tuple:
    """
    Parse raw CSV bytes into (rows, headers).

    Tries UTF-8, UTF-8 with BOM, then Latin-1 encoding in that order.
    Headers are normalised: stripped, lowercased, spaces → underscores.
    Empty rows are skipped.

    Returns:
        rows    — list of lists (string values)
        headers — list of column name strings
    """
    # Try multiple encodings to handle different CSV origins
    for encoding in ["utf-8", "utf-8-sig", "latin-1"]:
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError("Could not decode CSV file")

    reader = csv.reader(io.StringIO(text))
    headers = next(reader, None)
    if not headers:
        return [], []

    # Normalize column names
    headers = [h.strip().replace(" ", "_").lower() for h in headers]
    # Skip completely blank rows
    rows = [row for row in reader if any(cell.strip() for cell in row)]
    return rows, headers


def _parse_excel(content: bytes, ext: str) -> tuple:
    """
    Parse raw Excel bytes (.xlsx or .xls) into (rows, headers).

    Requires the `openpyxl` package (included in requirements.txt).
    Writes bytes to a temp file because openpyxl needs a file path.

    Returns:
        rows    — list of lists (string values)
        headers — list of column name strings
    """
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="openpyxl not installed. Run: pip install openpyxl"
        )

    # Write to a temp file so openpyxl can read it
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Open in read-only + data_only mode for performance
        wb = openpyxl.load_workbook(tmp_path, read_only=True, data_only=True)
        ws = wb.active

        all_rows = list(ws.iter_rows(values_only=True))
        if not all_rows:
            return [], []

        # First row is the header
        raw_headers = all_rows[0]
        headers = [
            (str(h).strip().replace(" ", "_").lower() if h else f"col_{i}")
            for i, h in enumerate(raw_headers)
        ]

        rows = []
        for row in all_rows[1:]:
            # Convert every cell to string; treat None as empty string
            converted = [str(cell) if cell is not None else "" for cell in row]
            if any(cell.strip() for cell in converted):  # skip blank rows
                rows.append(converted)

        wb.close()
        return rows, headers
    finally:
        # Always clean up the temp file
        os.unlink(tmp_path)


def _import_to_sqlite(table_name: str, headers: list, rows: list):
    """
    Create (or replace) a SQLite table and bulk-insert all rows.

    - Drops the existing table with the same name if it exists
    - Infers column types (INTEGER / REAL / TEXT) from the first 100 rows
    - Pads or trims each row to match the header count
    - Converts values to the inferred Python types before insertion
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Drop existing table with same name (replace behaviour)
    cursor.execute(f'DROP TABLE IF EXISTS "{table_name}"')

    # Infer column types from the first 100 data rows
    col_types = []
    for i in range(len(headers)):
        sample = [row[i] for row in rows[:100] if i < len(row)]
        col_types.append(get_column_types(sample))

    # Build and execute the CREATE TABLE statement
    col_defs = ", ".join(
        f'"{h}" {t}' for h, t in zip(headers, col_types)
    )
    cursor.execute(f'CREATE TABLE "{table_name}" ({col_defs})')

    # Prepare the parameterised INSERT statement
    placeholders = ", ".join(["?"] * len(headers))
    for row in rows:
        # Pad short rows / trim long rows to match header count
        padded = list(row[:len(headers)])
        while len(padded) < len(headers):
            padded.append(None)

        # Convert each value to the inferred column type
        converted = []
        for val, col_type in zip(padded, col_types):
            if val == "" or val is None:
                converted.append(None)
            elif col_type == "INTEGER":
                try:
                    converted.append(int(val))
                except (ValueError, TypeError):
                    converted.append(val)  # fall back to raw value
            elif col_type == "REAL":
                try:
                    converted.append(float(val))
                except (ValueError, TypeError):
                    converted.append(val)  # fall back to raw value
            else:
                converted.append(str(val))

        cursor.execute(
            f'INSERT INTO "{table_name}" VALUES ({placeholders})',
            converted
        )

    # Commit all inserts in one transaction
    conn.commit()
    conn.close()
