from app.services.intent_detector import detect_intent
from app.services.sql_templates import match_template
import json

test_questions = [
    "What is the total payment value?",
    "Show a bar chart of payment value by payment method",
    "What are the top 5 most expensive orders?",
    "How many customers are there?",
    "Show orders by status",
    "Monthly revenue trend",
    "Average review score",
    "Top 10 sellers by revenue",
    "Customers by state",
    "What are the top selling products?",
    "Show a pie chart of orders by status",
    "What is the average order value?",
]

for q in test_questions:
    intent = detect_intent(q)
    sql = match_template(q, intent)
    method = "TEMPLATE" if sql else "GEMINI"
    print(f"\n{'='*60}")
    print(f"Q: {q}")
    print(f"Intent: {intent['intent']} | Agg: {intent['aggregation_type']} | Chart: {intent['chart_requested']}")
    print(f"Entities: {intent['entities']} | Limit: {intent['modifiers']['limit']}")
    print(f"Method: {method}")
    if sql:
        print(f"SQL: {sql[:100]}{'...' if len(sql) > 100 else ''}")
