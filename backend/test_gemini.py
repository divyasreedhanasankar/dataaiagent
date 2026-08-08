from app.services.gemini_service import ask_gemini


response = ask_gemini(
    "Explain what a SQL database is in two simple sentences."
)

print(response)