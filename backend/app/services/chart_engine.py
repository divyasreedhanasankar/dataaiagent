import re

CHART_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
]

def is_time_column(key: str, values: list) -> bool:
    time_patterns = ['date', 'month', 'year', 'quarter', 'time', 'day']
    if not any(p in key.lower() for p in time_patterns):
        return False
        
    date_regex = re.compile(r'^\d{4}-\d{2}(-\d{2})?|\d{2}/\d{2}/\d{4}')
    valid_dates = sum(1 for v in values if v is not None and date_regex.match(str(v)))
    valid_len = len([v for v in values if v is not None])
    return valid_len > 0 and (valid_dates / valid_len) > 0.5

def is_numeric_column(values: list) -> bool:
    numeric_count = 0
    valid_values = [v for v in values if v is not None]
    if not valid_values:
        return False
        
    for v in valid_values:
        if isinstance(v, (int, float)):
            numeric_count += 1
        else:
            try:
                float(str(v))
                numeric_count += 1
            except ValueError:
                pass
    return (numeric_count / len(valid_values)) > 0.8

def is_string_column(values: list) -> bool:
    string_count = 0
    valid_values = [v for v in values if v is not None]
    if not valid_values:
        return False
        
    for v in valid_values:
        if isinstance(v, str) and not v.replace('.', '', 1).isdigit():
            string_count += 1
            
    return (string_count / len(valid_values)) > 0.6

def clean_data(data: list[dict], numeric_cols: list[str]) -> list[dict]:
    cleaned = []
    for row in data:
        new_row = dict(row)
        for col in numeric_cols:
            val = new_row.get(col)
            if val is None:
                new_row[col] = 0
            else:
                try:
                    new_row[col] = float(str(val))
                except ValueError:
                    new_row[col] = 0
        cleaned.append(new_row)
    return cleaned

def generate_title(question: str, x_label: str, y_label: str) -> str:
    q = question.lower().strip()
    remove_words = ["what is", "show me", "display", "give me", "list"]
    for w in remove_words:
        if q.startswith(w):
            q = q[len(w):].strip()
            
    if len(q) > 3 and not q.startswith("the "):
        return q.capitalize()
        
    return f"{y_label.replace('_', ' ').title()} by {x_label.replace('_', ' ').title()}"

def decide_chart(data: list[dict], question: str, intent: dict) -> dict | None:
    if not data:
        return None
        
    num_rows = len(data)
    columns = list(data[0].keys())
    num_cols = len(columns)
    
    if num_rows == 1:
        return None
        
    time_cols = []
    numeric_cols = []
    string_cols = []
    
    for col in columns:
        values = [row.get(col) for row in data]
        if is_time_column(col, values):
            time_cols.append(col)
        elif is_numeric_column(values):
            numeric_cols.append(col)
        elif is_string_column(values):
            string_cols.append(col)
            
    cleaned_data = clean_data(data, numeric_cols)
    
    chart_type = None
    x_key = None
    y_keys = []
    
    req_type = intent.get("chart_requested") if intent else None
    
    if req_type in ["bar", "hbar", "line", "area", "pie", "donut", "scatter"]:
        chart_type = req_type
        if string_cols and numeric_cols:
            x_key = string_cols[0]
            y_keys = numeric_cols[:1]
        elif time_cols and numeric_cols:
            x_key = time_cols[0]
            y_keys = numeric_cols[:1]
        elif len(numeric_cols) >= 2:
            x_key = numeric_cols[0]
            y_keys = numeric_cols[1:2]
    elif time_cols and numeric_cols:
        is_trend = any(w in question.lower() for w in ['trend', 'over time'])
        chart_type = "area" if is_trend else "line"
        x_key = time_cols[0]
        y_keys = [numeric_cols[0]]
        cleaned_data = sorted(cleaned_data, key=lambda x: str(x.get(x_key, '')))
    elif string_cols and numeric_cols:
        x_key = string_cols[0]
        y_keys = [numeric_cols[0]]
        
        unique_cats = len(set(str(row.get(x_key)) for row in cleaned_data))
        
        is_dist = any(w in question.lower() for w in ['distribution', 'percentage', 'share', 'proportion'])
        if is_dist:
            chart_type = "donut" if "donut" in question.lower() else "pie"
        elif unique_cats <= 6:
            chart_type = "pie"
        elif 7 <= unique_cats <= 15:
            chart_type = "bar"
        else:
            chart_type = "hbar"
            cleaned_data = sorted(cleaned_data, key=lambda x: x.get(y_keys[0], 0), reverse=True)[:15]
    elif len(numeric_cols) >= 2 and not string_cols:
        chart_type = "scatter"
        x_key = numeric_cols[0]
        y_keys = [numeric_cols[1]]
        
    if not chart_type or not x_key or not y_keys:
        return None
        
    title = generate_title(question, x_key, y_keys[0])
    
    series = [
        {
            "key": y_keys[0],
            "label": y_keys[0].replace('_', ' ').title(),
            "color": CHART_COLORS[0]
        }
    ]
    
    return {
        "type": chart_type,
        "title": title,
        "xKey": x_key,
        "series": series,
        "data": cleaned_data
    }
