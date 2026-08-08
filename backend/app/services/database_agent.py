"""
DataMind AI — Database Agent Pipeline

Orchestrates the full intelligence pipeline:

    Question
        ↓
    Cache Check
        ↓
    Intent Detection
        ↓
    SQL Template / Gemini
        ↓
    Execute Query
        ↓
    Result Analyzer
        ↓
    Answer Generator
        ↓
    Chart Engine
        ↓
    Structured Response
"""

import logging
import time

from app.services.intent_detector import detect_intent
from app.services.sql_templates import match_template
from app.services.cache import query_cache
from app.services.result_analyzer import analyze_results
from app.services.answer_generator import generate_answer
from app.services.chart_engine import decide_chart
from app.services.gemini_service import ask_gemini
from app.tools.get_schema import get_schema
from app.tools.execute_query import execute_query

logger = logging.getLogger("datamind.agent")


def generate_sql(user_question: str, intent: dict) -> tuple[str, str]:
    """
    Generate SQL from question + intent.
    Returns (sql_string, method) where method is "template" or "gemini".
    """
    # 1. Try SQL templates first (fast, no API call)
    sql = match_template(user_question, intent)
    if sql:
        logger.info(f"Template match for: {user_question[:50]}...")
        return sql, "template"

    # 2. Fall back to Gemini
    logger.info(f"Gemini fallback for: {user_question[:50]}...")
    schema = get_schema()

    prompt = f"""
You are an expert SQL analyst.

You are working with a SQLite e-commerce database.

Here is the database schema:

{schema}

User question:

{user_question}

Your task is to generate ONE valid SQLite SELECT query
that answers the user's question.

Rules:
1. Return ONLY the SQL query.
2. Do not use Markdown.
3. Do not use ```sql.
4. Only use tables and columns that exist in the schema.
5. Only generate SELECT or WITH queries.
6. Do not INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE.
7. Use appropriate JOIN conditions.
8. Use meaningful column aliases.
9. If the question asks for top results, use ORDER BY and LIMIT.
"""

    sql = ask_gemini(prompt)

    # Clean Gemini response
    sql = sql.strip()
    if sql.startswith("```"):
        sql = sql.replace("```sql", "")
        sql = sql.replace("```", "")
        sql = sql.strip()

    return sql, "gemini"


def ask_database(user_question: str) -> dict:
    """
    Full database-agent intelligence pipeline.

    Returns a structured response with:
    - answer: Natural language explanation
    - summary: Query metadata
    - sql: Generated SQL
    - result: Query data
    - chart: Chart metadata (or None)
    - insights: List of insight strings
    - tables_used: Referenced tables
    """

    pipeline_start = time.perf_counter()

    # ------------------------------------------
    # 1. CACHE CHECK
    # ------------------------------------------
    cached = query_cache.get(user_question)
    if cached:
        logger.info(f"Cache hit for: {user_question[:50]}...")
        cached["summary"]["from_cache"] = True
        return cached

    # ------------------------------------------
    # 2. INTENT DETECTION
    # ------------------------------------------
    intent = detect_intent(user_question)
    logger.info(f"Intent: {intent['intent']} | Entities: {intent['entities']}")

    # ------------------------------------------
    # 3. SQL GENERATION (template or Gemini)
    # ------------------------------------------
    try:
        sql, method = generate_sql(user_question, intent)
    except Exception as e:
        logger.error(f"SQL generation failed: {e}")
        return _error_response(
            question=user_question,
            error_msg="Unable to generate a SQL query for this question. Please try rephrasing.",
            pipeline_start=pipeline_start,
        )

    # ------------------------------------------
    # 4. EXECUTE QUERY
    # ------------------------------------------
    result = execute_query(sql)

    if not result["success"]:
        logger.warning(f"SQL execution failed: {result.get('error', 'Unknown')}")

        # If template SQL failed, try Gemini as fallback
        if method == "template":
            logger.info("Template SQL failed, falling back to Gemini...")
            try:
                sql, method = generate_sql(user_question, {**intent, "_force_gemini": True})
                # Override: force Gemini by passing a modified question
                schema = get_schema()
                prompt = f"""
You are an expert SQL analyst working with a SQLite e-commerce database.

Schema: {schema}

Question: {user_question}

Generate ONE valid SQLite SELECT query. Return ONLY the SQL query, no markdown.
"""
                sql = ask_gemini(prompt).strip()
                if sql.startswith("```"):
                    sql = sql.replace("```sql", "").replace("```", "").strip()
                method = "gemini"
                result = execute_query(sql)
            except Exception:
                pass

        if not result["success"]:
            return _error_response(
                question=user_question,
                error_msg=f"The query could not be executed: {result.get('error', 'Unknown error')}. Try rephrasing your question.",
                sql=sql,
                pipeline_start=pipeline_start,
            )

    data = result.get("data", [])
    columns = result.get("columns", [])
    row_count = result.get("row_count", 0)
    execution_time_ms = result.get("execution_time_ms", 0)

    # Extract tables from SQL
    tables_used = _extract_tables(sql)

    # ------------------------------------------
    # 5. ANALYZE RESULTS → insights
    # ------------------------------------------
    try:
        insights = analyze_results(data, user_question, intent)
    except Exception as e:
        logger.warning(f"Result analysis failed: {e}")
        insights = []

    # ------------------------------------------
    # 6. GENERATE ANSWER → natural language
    # ------------------------------------------
    try:
        answer = generate_answer(user_question, data, intent, sql)
    except Exception as e:
        logger.warning(f"Answer generation failed: {e}")
        answer = _fallback_answer(data, columns, row_count)

    # ------------------------------------------
    # 7. CHART ENGINE → chart metadata
    # ------------------------------------------
    try:
        chart = decide_chart(data, user_question, intent)
    except Exception as e:
        logger.warning(f"Chart engine failed: {e}")
        chart = None

    # ------------------------------------------
    # 8. BUILD RESPONSE
    # ------------------------------------------
    total_time_ms = round((time.perf_counter() - pipeline_start) * 1000, 1)

    response = {
        "success": True,
        "answer": answer,
        "summary": {
            "rows": row_count,
            "execution_time_ms": execution_time_ms,
            "total_time_ms": total_time_ms,
            "from_cache": False,
            "method": method,
        },
        "sql": sql,
        "result": {
            "columns": columns,
            "data": data,
            "row_count": row_count,
        },
        "chart": chart,
        "insights": insights,
        "tables_used": tables_used,
    }

    # ------------------------------------------
    # 9. CACHE RESULT
    # ------------------------------------------
    query_cache.set(user_question, response)

    return response


def _extract_tables(sql: str) -> list[str]:
    """Extract table names from SQL query."""
    import re
    matches = re.findall(r'(?:FROM|JOIN)\s+["`]?(\w+)["`]?', sql, re.IGNORECASE)
    return list(dict.fromkeys(matches))  # unique, preserve order


def _fallback_answer(data: list, columns: list, row_count: int) -> str:
    """Generate a basic answer when the answer generator fails."""
    from app.services.answer_generator import _is_currency_col
    if not data:
        return "The query executed successfully, but no matching data was found."
    if row_count == 1 and len(columns) == 1:
        key = columns[0]
        val = data[0].get(key, "N/A")
        if isinstance(val, (int, float)):
            if _is_currency_col(key):
                val = f"₹{val:,.2f}"
            elif float(val) == int(val):
                val = f"{int(val):,}"
            else:
                val = f"{val:,.2f}"
        return f"The **{key.replace('_', ' ').title()}** is **{val}**."
    return f"The query returned **{row_count:,}** records across **{len(columns)}** columns. See the detailed table below."


def _error_response(question: str, error_msg: str, sql: str = "", pipeline_start: float = 0) -> dict:
    """Build a standardized error response."""
    total_time_ms = round((time.perf_counter() - pipeline_start) * 1000, 1) if pipeline_start else 0
    return {
        "success": False,
        "answer": error_msg,
        "summary": {
            "rows": 0,
            "execution_time_ms": 0,
            "total_time_ms": total_time_ms,
            "from_cache": False,
            "method": "error",
        },
        "sql": sql,
        "result": {
            "columns": [],
            "data": [],
            "row_count": 0,
        },
        "chart": None,
        "insights": [],
        "tables_used": [],
    }