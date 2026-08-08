from app.services.gemini_service import ask_gemini


def explain_data(question: str, sql: str, data: dict) -> str:
    """
    Generate a natural-language explanation of database results.
    """

    prompt = f"""
You are a professional data analyst.

User question:
{question}

SQL query used:
{sql}

Database result:
{data}

Explain the result clearly for a non-technical user.

Rules:
1. Directly answer the user's question.
2. Mention important numbers.
3. Highlight useful insights.
4. Do not invent information.
5. Do not mention information that isn't present in the result.
6. Keep the explanation concise but meaningful.
"""

    return ask_gemini(prompt)