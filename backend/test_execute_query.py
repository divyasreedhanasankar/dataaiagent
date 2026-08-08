from app.tools.execute_query import execute_query


query = """
SELECT
    order_status,
    COUNT(*) AS total_orders
FROM orders
GROUP BY order_status
ORDER BY total_orders DESC;
"""

result = execute_query(query)

print(result)