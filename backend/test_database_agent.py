from app.services.database_agent import ask_database


question = "How many orders were delivered?"

response = ask_database(question)

print("\nQUESTION:")
print(response["question"])

print("\nGENERATED SQL:")
print(response["sql"])

print("\nDATABASE RESULT:")
print(response["result"])