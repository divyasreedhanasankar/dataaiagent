import re

def detect_intent(question: str) -> dict:
    q = question.lower()
    
    intent_data = {
        "intent": "general",
        "aggregation_type": None,
        "chart_requested": None,
        "entities": [],
        "modifiers": {
            "limit": None,
            "order": None,
            "time_group": None,
            "group_by_field": None
        }
    }
    
    # Aggregation
    if any(word in q for word in ["total", "sum", "how much", "overall"]):
        intent_data["intent"] = "aggregation"
        intent_data["aggregation_type"] = "sum"
    elif any(word in q for word in ["average", "avg", "mean"]):
        intent_data["intent"] = "aggregation"
        intent_data["aggregation_type"] = "avg"
    
    # Ranking
    elif any(word in q for word in ["highest", "maximum", "max", "largest", "most expensive", "biggest"]):
        intent_data["intent"] = "ranking"
        intent_data["aggregation_type"] = "max"
    elif any(word in q for word in ["lowest", "minimum", "min", "smallest", "cheapest", "least"]):
        intent_data["intent"] = "ranking"
        intent_data["aggregation_type"] = "min"
    elif any(word in q for word in ["top", "bottom", "best", "worst", "rank"]):
        intent_data["intent"] = "ranking"
        
    # Count
    elif any(word in q for word in ["how many", "count", "number of", "total number"]):
        intent_data["intent"] = "count"
        
    # Trend & Distribution
    elif any(word in q for word in ["trend", "over time", "monthly", "yearly", "growth", "decline"]):
        intent_data["intent"] = "trend"
    elif any(word in q for word in ["breakdown", "distribution", "proportion", "share", "percentage", " by "]):
        intent_data["intent"] = "distribution"
        
    # Chart
    if any(word in q for word in ["chart", "graph", "plot", "visualize", "draw"]):
        if "bar" in q:
            intent_data["chart_requested"] = "bar"
        elif "pie" in q:
            intent_data["chart_requested"] = "pie"
        elif "line" in q:
            intent_data["chart_requested"] = "line"
        elif "area" in q:
            intent_data["chart_requested"] = "area"
        elif "scatter" in q:
            intent_data["chart_requested"] = "scatter"
        elif "donut" in q:
            intent_data["chart_requested"] = "donut"
        elif "hbar" in q:
            intent_data["chart_requested"] = "hbar"
        else:
            intent_data["chart_requested"] = "bar" # Default
            
    # Entities
    if any(w in q for w in ["payment", "revenue", "amount"]):
        intent_data["entities"].append("payment")
    if "order" in q:
        intent_data["entities"].append("order")
    if any(w in q for w in ["customer", "buyer"]):
        intent_data["entities"].append("customer")
    if any(w in q for w in ["product", "item"]):
        intent_data["entities"].append("product")
    if any(w in q for w in ["seller", "vendor"]):
        intent_data["entities"].append("seller")
    if any(w in q for w in ["review", "rating", "score"]):
        intent_data["entities"].append("review")
    if any(w in q for w in ["delivery", "shipping"]):
        intent_data["entities"].append("delivery")
    if "category" in q:
        intent_data["entities"].append("category")
    if any(w in q for w in ["state", "city", "location"]):
        intent_data["entities"].append("geolocation")
        
    # Modifiers
    limit_match = re.search(r'(top|bottom)\s+(\d+)', q)
    if limit_match:
        direction = limit_match.group(1)
        limit = int(limit_match.group(2))
        intent_data["modifiers"]["limit"] = limit
        if direction == "top":
            intent_data["modifiers"]["order"] = "desc"
        else:
            intent_data["modifiers"]["order"] = "asc"
            
    if any(w in q for w in ["monthly", "per month", "by month"]):
        intent_data["modifiers"]["time_group"] = "month"
    elif any(w in q for w in ["yearly", "annual", "per year", "by year"]):
        intent_data["modifiers"]["time_group"] = "year"
    elif any(w in q for w in ["quarterly", "per quarter", "by quarter"]):
        intent_data["modifiers"]["time_group"] = "quarter"
        
    if "by status" in q:
        intent_data["modifiers"]["group_by_field"] = "order_status"
    elif "by payment method" in q or "by payment type" in q:
        intent_data["modifiers"]["group_by_field"] = "payment_type"
    elif "by category" in q:
        intent_data["modifiers"]["group_by_field"] = "product_category_name"
    elif "by state" in q:
        intent_data["modifiers"]["group_by_field"] = "customer_state"
    elif "by city" in q:
        intent_data["modifiers"]["group_by_field"] = "customer_city"
        
    return intent_data
