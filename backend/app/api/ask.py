"""
DataMind AI — /api/ask endpoint

Returns a structured AI-powered response with:
- Natural language answer
- Generated SQL
- Query results
- Chart metadata
- Insights
- Performance metadata
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.database_agent import ask_database

logger = logging.getLogger("datamind.api")

router = APIRouter()


class AskRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_question(request: AskRequest):
    """
    Process a natural-language question about the database.

    Returns a structured response with AI-generated answer,
    SQL query, results, charts, and insights.
    """

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    try:
        result = ask_database(question)

        logger.info(
            f"Query processed: '{question[:50]}...' | "
            f"Method: {result['summary']['method']} | "
            f"Rows: {result['summary']['rows']} | "
            f"Time: {result['summary']['total_time_ms']}ms | "
            f"Cache: {result['summary']['from_cache']}"
        )

        return result

    except Exception as e:
        logger.error(f"Unexpected error processing question: {e}", exc_info=True)

        # Never expose raw tracebacks to the frontend
        error_str = str(e).lower()

        if "503" in error_str or "unavailable" in error_str or "demand" in error_str:
            user_message = "The AI service is temporarily experiencing high demand. Please try again in a few moments."
        elif "429" in error_str or "quota" in error_str or "exhausted" in error_str:
            user_message = "AI request limit reached. Please wait a moment and try again."
        elif "api_key" in error_str or "api key" in error_str:
            user_message = "AI service configuration error. Please check the backend API key."
        elif "timeout" in error_str:
            user_message = "The request timed out. Try a simpler question."
        else:
            user_message = "An error occurred while processing your question. Please try again."

        # Return a structured error response (not an HTTP exception)
        # so the frontend can still render it gracefully
        return {
            "success": False,
            "answer": user_message,
            "summary": {
                "rows": 0,
                "execution_time_ms": 0,
                "total_time_ms": 0,
                "from_cache": False,
                "method": "error",
            },
            "sql": "",
            "result": {
                "columns": [],
                "data": [],
                "row_count": 0,
            },
            "chart": None,
            "insights": [],
            "tables_used": [],
        }