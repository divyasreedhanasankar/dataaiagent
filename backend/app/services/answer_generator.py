def format_label(key: str) -> str:
    return key.replace("_", " ").title()

# Keywords that signal a column holds a monetary/currency value
_CURRENCY_KEYWORDS = {'value', 'price', 'freight', 'revenue', 'cost', 'amount', 'payment', 'total_value'}

# Keywords that signal a column holds a count/quantity — never currency
_COUNT_KEYWORDS = {'count', 'qty', 'quantity', 'num', 'number', 'total_orders',
                   'rank', 'items', 'sold', 'units', 'id', 'orders', 'products',
                   'total_products', 'total_customers', 'total_sellers', 'total_reviews',
                   'avg_score', 'average_score', 'score', 'rating', 'percentage', 'rate',
                   'delivered_orders', 'cancelled_orders', 'order_count'}

def _is_currency_col(col: str) -> bool:
    """Return True only if the column name clearly represents a monetary value."""
    col_lower = col.lower()
    # If the column name contains any count keyword, it is never currency
    if any(kw in col_lower for kw in _COUNT_KEYWORDS):
        return False
    return any(kw in col_lower for kw in _CURRENCY_KEYWORDS)

def format_number(value, is_currency=False) -> str:
    if value is None:
        return "0"
    try:
        num = float(value)
        formatted = f"{num:,.2f}"
        if formatted.endswith(".00") and not is_currency:
            formatted = formatted[:-3]
        if is_currency:
            return f"₹{formatted}"
        return formatted
    except (ValueError, TypeError):
        return str(value)

def generate_answer(question: str, data: list[dict], intent: dict, sql: str) -> str:
    if not data:
        return "No data available."
        
    num_rows = len(data)
    columns = list(data[0].keys())
    num_cols = len(columns)
    
    # 1. Single aggregate (1 row, 1 col)
    if num_rows == 1 and num_cols == 1:
        col = columns[0]
        val = data[0][col]
        is_curr = _is_currency_col(col)
        col_lower = col.lower()
        _q_lower = question.lower()
        is_count = (
            any(kw in col_lower for kw in _COUNT_KEYWORDS)
            or sql.lower().count('count') > 0
            or any(p in _q_lower for p in ('how many', 'number of', 'no. of', 'no of', 'count of'))
        )
        if is_count:
            return f"There are **{format_number(val, False)} total {format_label(col).lower()}** recorded in the database."
        return f"The {format_label(col).lower()} is **{format_number(val, is_curr)}** across all recorded transactions."
        
    # 2. Single row, multiple columns
    if num_rows == 1 and num_cols > 1:
        lines = ["Here are the details:"]
        for k, v in data[0].items():
            is_curr = _is_currency_col(k)
            val_str = format_number(v, is_curr) if isinstance(v, (int, float)) or str(v).replace('.', '', 1).isdigit() else str(v)
            lines.append(f"- **{format_label(k)}**: {val_str}")
        return "\n".join(lines)
        
    # Identify column types
    time_cols = [c for c in columns if any(x in c.lower() for x in ['date', 'time', 'month', 'year', 'day'])]
    string_cols = [c for c in columns if isinstance(data[0].get(c), str) and c not in time_cols]
    numeric_cols = [c for c in columns if c not in time_cols and c not in string_cols]
    
    # Fallback to duck typing
    if not numeric_cols:
        for c in columns:
            if c not in time_cols and c not in string_cols:
                try:
                    float(data[0].get(c))
                    numeric_cols.append(c)
                except (ValueError, TypeError):
                    string_cols.append(c)
    
    # 3. Time series
    if time_cols and numeric_cols and num_rows > 1:
        val_col = numeric_cols[0]
        time_col = time_cols[0]
        sorted_data = sorted(data, key=lambda x: str(x.get(time_col, '')))
        
        is_curr = _is_currency_col(val_col)
        
        values = [float(r.get(val_col) or 0) for r in sorted_data]
        peak_val = max(values)
        lowest_val = min(values)
        avg_val = sum(values) / len(values)
        
        peak_row = next(r for r in sorted_data if float(r.get(val_col) or 0) == peak_val)
        lowest_row = next(r for r in sorted_data if float(r.get(val_col) or 0) == lowest_val)
        
        trend = "upward trend" if values[-1] >= values[0] else "downward trend"
        
        lines = [
            f"### {format_label(time_col)} Trend",
            "",
            f"{format_label(val_col)} shows an **{trend}** over the analyzed period.",
            "",
            f"- **Peak**: {peak_row.get(time_col)} - {format_number(peak_val, is_curr)}",
            f"- **Lowest**: {lowest_row.get(time_col)} - {format_number(lowest_val, is_curr)}",
            f"- **Average**: {format_number(avg_val, is_curr)}"
        ]
        return "\n".join(lines)
        
    # 4. Distribution / Group by
    if string_cols and numeric_cols and num_rows > 1:
        cat_col = string_cols[0]
        val_col = numeric_cols[0]
        
        is_curr = _is_currency_col(val_col)
        total_val = sum(float(r.get(val_col) or 0) for r in data)
        
        if total_val > 0 and len(data) <= 20: # Make sure it's a distributable set
            lines = [f"### {format_label(val_col)} Distribution by {format_label(cat_col)}", ""]
            lines.append(f"| {format_label(cat_col)} | {format_label(val_col)} | Share |")
            lines.append(f"|---|---|---|")
            
            sorted_data = sorted(data, key=lambda x: float(x.get(val_col) or 0), reverse=True)
            
            for row in sorted_data:
                val = float(row.get(val_col) or 0)
                share = (val / total_val) * 100
                lines.append(f"| {row.get(cat_col)} | {format_number(val, is_curr)} | {share:.1f}% |")
                
            top_cat = sorted_data[0].get(cat_col)
            top_share = (float(sorted_data[0].get(val_col) or 0) / total_val) * 100
            lines.append("")
            lines.append(f"{str(top_cat).title()} is the dominant category, accounting for **{top_share:.1f}%** of the total.")
            return "\n".join(lines)

    # 5. Generic Multiple Rows (ranking/top N)
    title = f"### Top {num_rows} Results" if num_rows <= 20 else "### Results"
    lines = [title, ""]
    for i, row in enumerate(data[:15], 1):
        items = list(row.items())
        if items:
            first_key, first_val = items[0]
            is_curr = _is_currency_col(first_key)
            val_str = format_number(first_val, is_curr) if isinstance(first_val, (int, float)) or str(first_val).replace('.', '', 1).isdigit() else str(first_val)
            
            if len(items) > 1:
                sec_key, sec_val = items[1]
                sec_curr = _is_currency_col(sec_key)
                sec_str = format_number(sec_val, sec_curr) if isinstance(sec_val, (int, float)) or str(sec_val).replace('.', '', 1).isdigit() else str(sec_val)
                lines.append(f"{i}. **{str(first_val).title()}** - **{format_label(sec_key)}: {sec_str}**")
                
                for k, v in items[2:]:
                    k_curr = _is_currency_col(k)
                    v_str = format_number(v, k_curr) if isinstance(v, (int, float)) or str(v).replace('.', '', 1).isdigit() else str(v)
                    lines.append(f"   - {format_label(k)}: `{v}`" if 'id' in k.lower() else f"   - {format_label(k)}: {v_str}")
            else:
                lines.append(f"{i}. **{format_label(first_key)}**: {val_str}")
            lines.append("")
            
    return "\n".join(lines)
