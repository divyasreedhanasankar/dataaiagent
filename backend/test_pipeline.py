from app.services.database_agent import ask_database
import json

r = ask_database("What is the total payment value?")
# Print everything except the full data array
summary = {k: v for k, v in r.items() if k != "result"}
print(json.dumps(summary, indent=2, default=str))
print(f"\nResult rows: {len(r['result']['data'])}")
print(f"Columns: {r['result']['columns']}")
if r['result']['data']:
    print(f"First row: {r['result']['data'][0]}")
