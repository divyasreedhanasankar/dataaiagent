def analyze_results(data: list[dict], question: str, intent: dict) -> list[str]:
    if not data:
        return []
        
    insights = []
    
    # Analyze shape
    num_rows = len(data)
    columns = list(data[0].keys())
    num_cols = len(columns)
    
    # 1. Single value result
    if num_rows == 1 and num_cols == 1:
        insights.append("This represents the aggregate across all records in the database.")
        return insights
        
    # 2. Single row, multiple columns
    if num_rows == 1 and num_cols > 1:
        insights.append("This record contains the following details:")
        for k, v in data[0].items():
            insights.append(f"The {k.replace('_', ' ').title()} is {v}.")
        return insights
        
    # 3. Multiple rows
    if num_rows > 1:
        # Find numeric columns
        numeric_cols = []
        for col in columns:
            try:
                # Check if first valid value is numeric
                val = next((row[col] for row in data if row[col] is not None), None)
                if val is not None:
                    float(val)
                    numeric_cols.append(col)
            except ValueError:
                pass
                
        for col in numeric_cols:
            values = []
            for row in data:
                try:
                    if row[col] is not None:
                        values.append(float(row[col]))
                except ValueError:
                    pass
            
            if values:
                total_sum = sum(values)
                avg = total_sum / len(values)
                max_val = max(values)
                min_val = min(values)
                range_val = max_val - min_val
                
                # Get rows for max/min
                max_row = next((r for r in data if r.get(col) is not None and float(r[col]) == max_val), data[0])
                min_row = next((r for r in data if r.get(col) is not None and float(r[col]) == min_val), data[0])
                
                insights.append(f"For {col.replace('_', ' ').title()}, the total sum is {total_sum:,.2f}.")
                insights.append(f"The average {col.replace('_', ' ').title()} is {avg:,.2f}.")
                
                # Try to use another column for context
                context_col = columns[0] if columns[0] != col else (columns[1] if len(columns) > 1 else None)
                if context_col:
                    insights.append(f"The maximum value is {max_val:,.2f} ({max_row.get(context_col)}) and minimum is {min_val:,.2f} ({min_row.get(context_col)}).")
                else:
                    insights.append(f"The maximum value is {max_val:,.2f} and minimum is {min_val:,.2f}.")
                    
                insights.append(f"The range is {range_val:,.2f}.")
                
                # Try to find dominant category if there's a string column
                string_cols = [c for c in columns if c not in numeric_cols]
                if string_cols and total_sum > 0:
                    cat_col = string_cols[0]
                    # Check for dominant category
                    for row in data:
                        try:
                            val = float(row[col]) if row[col] is not None else 0
                            if val / total_sum > 0.5:
                                insights.append(f"'{row[cat_col]}' is the dominant category, making up more than 50% of the total.")
                                break
                        except:
                            pass
                            
        # Time series analysis
        time_cols = [c for c in columns if any(x in c.lower() for x in ['date', 'time', 'month', 'year'])]
        if time_cols and numeric_cols:
            t_col = time_cols[0]
            n_col = numeric_cols[0]
            sorted_data = sorted(data, key=lambda x: str(x.get(t_col, '')))
            vals = [float(r[n_col] or 0) for r in sorted_data]
            if len(vals) >= 2:
                trend = "increasing" if vals[-1] > vals[0] else ("decreasing" if vals[-1] < vals[0] else "stable")
                peak_idx = vals.index(max(vals))
                trough_idx = vals.index(min(vals))
                insights.append(f"The trend is {trend} over time.")
                insights.append(f"The peak period is {sorted_data[peak_idx].get(t_col)}.")
                insights.append(f"The trough period is {sorted_data[trough_idx].get(t_col)}.")
                            
        # Rankings (top N) / Gap
        if numeric_cols and num_rows >= 2 and not time_cols:
            sort_col = numeric_cols[0]
            sorted_data = sorted([r for r in data if r[sort_col] is not None], key=lambda x: float(x[sort_col]), reverse=True)
            if len(sorted_data) >= 2:
                top_val = float(sorted_data[0][sort_col])
                sec_val = float(sorted_data[1][sort_col])
                last_val = float(sorted_data[-1][sort_col])
                
                insights.append(f"The gap between the #1 and #2 items is {(top_val - sec_val):,.2f}.")
                insights.append(f"The gap between the top and bottom items is {(top_val - last_val):,.2f}.")
                
    return insights[:7] # limit to 3-7 insights
