from app.tools.explain_data import explain_data


question = "How many orders were delivered?"

sql = """
SELECT COUNT(order_id) AS delivered_orders_count
FROM orders
WHERE order_status = 'delivered'
"""

data = {
    "success": True,
    "row_count": 1,
    "data": [
        {
            "delivered_orders_count": 96478
        }
    ]
}


result = explain_data(
    question,
    sql,
    data
)

print("\nAI EXPLANATION:")
print(result)