def match_template(question: str, intent: dict) -> str | None:
    q = question.lower()
    limit = intent.get("modifiers", {}).get("limit") or 10
    
    # Payment queries
    if "total" in q and ("payment" in q or "revenue" in q):
        return "SELECT ROUND(SUM(payment_value), 2) AS total_payment_value FROM payments"
    if "average" in q and "payment" in q:
        return "SELECT ROUND(AVG(payment_value), 2) AS average_payment_value FROM payments"
    if "payment" in q and ("method" in q or "type" in q or "by" in q):
        return "SELECT payment_type, COUNT(*) AS count, ROUND(SUM(payment_value), 2) AS total_value FROM payments GROUP BY payment_type ORDER BY total_value DESC"
    if "highest" in q and "payment" in q:
        return "SELECT order_id, payment_type, payment_value FROM payments ORDER BY payment_value DESC LIMIT 1"
        
    # Order queries
    if ("how many" in q or "count" in q or "number of" in q or "total" in q) and "order" in q and "value" not in q and "expensive" not in q and "status" not in q and "product" not in q:
        return "SELECT COUNT(*) AS total_orders FROM orders"
    if "order" in q and "status" in q:
        return "SELECT order_status, COUNT(*) AS count FROM orders GROUP BY order_status ORDER BY count DESC"
    if "delivered" in q and "order" in q:
        return "SELECT COUNT(*) AS delivered_orders FROM orders WHERE order_status = 'delivered'"
    if ("cancelled" in q or "canceled" in q) and "order" in q:
        return "SELECT COUNT(*) AS cancelled_orders FROM orders WHERE order_status = 'canceled'"
    if "expensive" in q and "order" in q:
        return f"SELECT o.order_id, ROUND(SUM(oi.price + oi.freight_value), 2) AS total_value, o.order_status FROM orders o JOIN order_items oi ON o.order_id = oi.order_id GROUP BY o.order_id ORDER BY total_value DESC LIMIT {limit}"
    if "monthly" in q and "order" in q:
        return "SELECT strftime('%Y-%m', order_purchase_timestamp) AS month, COUNT(*) AS order_count FROM orders GROUP BY month ORDER BY month"
        
    # Customer queries
    if ("how many" in q or "count" in q or "number of" in q or "total" in q) and "customer" in q:
        return "SELECT COUNT(DISTINCT customer_unique_id) AS total_customers FROM customers"
    if "customer" in q and "state" in q:
        return "SELECT customer_state, COUNT(*) AS count FROM customers GROUP BY customer_state ORDER BY count DESC"
    if "customer" in q and "city" in q:
        return "SELECT customer_city, COUNT(*) AS count FROM customers GROUP BY customer_city ORDER BY count DESC LIMIT 20"
    if "top" in q and "customer" in q:
        return f"SELECT c.customer_unique_id, COUNT(o.order_id) AS order_count, ROUND(SUM(p.payment_value), 2) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN payments p ON o.order_id = p.order_id GROUP BY c.customer_unique_id ORDER BY total_spent DESC LIMIT {limit}"
        
    # Product queries
    if "total" in q and "product" in q:
        return "SELECT COUNT(*) AS total_products FROM products"
    if "product" in q and "category" in q:
        return "SELECT COALESCE(ct.product_category_name_english, p.product_category_name) AS category, COUNT(*) AS count FROM products p LEFT JOIN category_translation ct ON p.product_category_name = ct.product_category_name GROUP BY category ORDER BY count DESC"
    if ("top" in q or "best" in q or "selling" in q) and "product" in q and "category" not in q:
        order_by = "items_sold DESC" if ("order" in q or "sold" in q or "volume" in q) else "total_revenue DESC"
        return f"SELECT COALESCE(ct.product_category_name_english, p.product_category_name) AS category, ROUND(SUM(oi.price), 2) AS total_revenue, COUNT(oi.order_id) AS items_sold, p.product_id FROM products p JOIN order_items oi ON p.product_id = oi.product_id LEFT JOIN category_translation ct ON p.product_category_name = ct.product_category_name GROUP BY p.product_id ORDER BY {order_by} LIMIT {limit}"
    if "top" in q and "category" in q and ("revenue" in q or "selling" in q):
        return f"SELECT COALESCE(ct.product_category_name_english, p.product_category_name) AS category, COUNT(oi.order_id) AS items_sold, ROUND(SUM(oi.price), 2) AS total_revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id LEFT JOIN category_translation ct ON p.product_category_name = ct.product_category_name GROUP BY category ORDER BY total_revenue DESC LIMIT {limit}"
        
    # Seller queries
    if "total" in q and "seller" in q:
        return "SELECT COUNT(*) AS total_sellers FROM sellers"
    if "seller" in q and "state" in q:
        return "SELECT seller_state, COUNT(*) AS count FROM sellers GROUP BY seller_state ORDER BY count DESC"
    if "top" in q and "seller" in q:
        return f"SELECT s.seller_id, s.seller_city, s.seller_state, COUNT(oi.order_id) AS items_sold, ROUND(SUM(oi.price), 2) AS total_revenue FROM sellers s JOIN order_items oi ON s.seller_id = oi.seller_id GROUP BY s.seller_id ORDER BY total_revenue DESC LIMIT {limit}"
        
    # Review queries
    if "average" in q and "review" in q:
        return "SELECT ROUND(AVG(review_score), 2) AS average_score FROM reviews"
    if "review" in q and ("score" in q or "distribution" in q):
        return "SELECT review_score, COUNT(*) AS count FROM reviews GROUP BY review_score ORDER BY review_score DESC"
        
    # Time/Trend queries
    if ("monthly" in q or "month" in q) and ("revenue" in q or "sales" in q or "trend" in q):
        return "SELECT strftime('%Y-%m', o.order_purchase_timestamp) AS month, ROUND(SUM(p.payment_value), 2) AS total_sales FROM orders o JOIN payments p ON o.order_id = p.order_id GROUP BY month ORDER BY month"
    if ("yearly" in q or "year" in q) and ("revenue" in q or "sales" in q):
        return "SELECT strftime('%Y', o.order_purchase_timestamp) AS year, ROUND(SUM(p.payment_value), 2) AS total_sales FROM orders o JOIN payments p ON o.order_id = p.order_id GROUP BY year ORDER BY year"
    if ("sales" in q or "revenue" in q) and ("trend" in q or "over time" in q or "history" in q):
        return "SELECT strftime('%Y-%m', o.order_purchase_timestamp) AS month, ROUND(SUM(p.payment_value), 2) AS total_sales FROM orders o JOIN payments p ON o.order_id = p.order_id GROUP BY month ORDER BY month"
    if ("order" in q or "orders" in q) and ("over time" in q or "trend" in q):
        return "SELECT strftime('%Y-%m', order_purchase_timestamp) AS month, COUNT(*) AS order_count FROM orders GROUP BY month ORDER BY month"
        
    # Cross-entity
    if "revenue" in q and "state" in q:
        return "SELECT c.customer_state AS state, ROUND(SUM(p.payment_value), 2) AS revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN payments p ON o.order_id = p.order_id GROUP BY state ORDER BY revenue DESC"
    if "average order value" in q:
        return "SELECT ROUND(AVG(total), 2) AS avg_order_value FROM (SELECT o.order_id, SUM(p.payment_value) AS total FROM orders o JOIN payments p ON o.order_id = p.order_id GROUP BY o.order_id)"

    return None
