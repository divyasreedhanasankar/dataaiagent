/**
 * response-formatter.ts — Universal Response Formatter for DataMind AI
 *
 * THIS IS THE ONLY FORMATTER FOR CONVERTING BACKEND JSON INTO UI PAYLOADS.
 * All formatting, markdown generation, chart config detection, and insights
 * extraction must pass through formatResponse().
 */

import type { AskResponse } from "@/services/api";
import type { ChartPayload, ChartType, SqlPayload, TablePayload } from "@/types";
import { CHART_COLORS } from "./chart-utils";

export interface FormattedResponse {
  content: string;
  sql?: SqlPayload;
  table?: TablePayload;
  chart?: ChartPayload | null;
  insights?: string[];
}

// ==========================================
// COLUMN KIND CLASSIFICATION
// ==========================================

type ColumnKind =
  | "id"
  | "currency"
  | "percentage"
  | "count"
  | "date"
  | "boolean"
  | "name"
  | "numeric"
  | "text";

const ID_PATTERNS = /(_id|_key|_code|_hash|_uuid)$/i;
const CURRENCY_PATTERNS = /(value|price|cost|amount|revenue|total|payment|freight|fee|spend|spent|salary|budget|income|profit)/i;
const PERCENTAGE_PATTERNS = /(percent|pct|ratio|rate|share|proportion|_prc)/i;
const COUNT_PATTERNS = /(count|qty|quantity|num|number|total_orders|total_customers|total_products|total_sellers|items_sold|times_sold)/i;
const DATE_PATTERNS = /(date|time|timestamp|month|year|quarter|day|week|created|updated|_at$)/i;
const NAME_PATTERNS = /(name|title|label|category|status|type|city|state|description|method|channel)/i;

function classifyColumn(key: string, sampleValues: unknown[]): ColumnKind {
  const k = key.toLowerCase();

  if (ID_PATTERNS.test(k) || k === "id") return "id";
  if (DATE_PATTERNS.test(k)) return "date";
  if (PERCENTAGE_PATTERNS.test(k)) return "percentage";
  if (COUNT_PATTERNS.test(k) && !CURRENCY_PATTERNS.test(k)) return "count";
  if (CURRENCY_PATTERNS.test(k)) return "currency";
  if (NAME_PATTERNS.test(k)) return "name";

  const nonNull = sampleValues.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "text";

  const first = nonNull[0];
  if (typeof first === "boolean") return "boolean";
  if (typeof first === "number") return "numeric";

  const strVal = String(first);
  if (/^\d{4}[-/]\d{2}([-/]\d{2})?/.test(strVal)) return "date";
  if (/^-?\d+(\.\d+)?$/.test(strVal)) return "numeric";

  return "text";
}

// ==========================================
// STRING & VALUE FORMATTING HELPERS
// ==========================================

export function snakeToLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bId\b/g, "ID")
    .replace(/\bSql\b/g, "SQL")
    .replace(/\bApi\b/g, "API")
    .replace(/\bUrl\b/g, "URL");
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const inMillions = value / 1_000_000;
    return `₹${inMillions.toFixed(inMillions % 1 === 0 ? 0 : 2)}M`;
  }
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatDate(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(m, 10) - 1;
    return monthIdx >= 0 && monthIdx < 12 ? `${months[monthIdx]} ${y}` : value;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const d = new Date(value);
      return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return value;
    }
  }
  return value;
}

function formatNumeric(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-IN");
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCellValue(value: unknown, kind: ColumnKind): string {
  if (value === null || value === undefined || value === "") return "—";

  const num = typeof value === "number" ? value : Number(value);
  const str = String(value);

  switch (kind) {
    case "currency":
      return isNaN(num) ? str : formatCurrency(num);
    case "percentage":
      return isNaN(num) ? str : formatPercentage(num);
    case "count":
      return isNaN(num) ? str : formatCount(num);
    case "numeric":
      return isNaN(num) ? str : formatNumeric(num);
    case "date":
      return formatDate(str);
    case "boolean":
      return value === true || str === "1" || str.toLowerCase() === "true" ? "Yes" : "No";
    case "id":
      return str;
    case "name":
    case "text":
    default:
      return str;
  }
}

// ==========================================
// HEADING GENERATION
// ==========================================

function generateHeading(question: string): string {
  let q = question.trim().replace(/\?+$/, "").trim();
  const fillers = [
    /^show me /i, /^show /i, /^display /i, /^list /i,
    /^get /i, /^find /i, /^what (?:is|are) (?:the )?/i,
    /^how many /i, /^give me /i, /^tell me /i,
  ];
  for (const f of fillers) {
    q = q.replace(f, "");
  }
  q = q.charAt(0).toUpperCase() + q.slice(1);
  if (q.length > 60) q = q.slice(0, 57) + "…";
  return `## ${q}`;
}

// ==========================================
// MARKDOWN GENERATOR
// ==========================================

function buildMarkdownContent(
  data: Record<string, unknown>[],
  columns: string[],
  kinds: Record<string, ColumnKind>,
  question: string
): string {
  if (!data || data.length === 0) {
    return "No matching records were found for your query.";
  }

  const numRows = data.length;
  const numCols = columns.length;

  // CASE 1: Single aggregate (1 row, 1 col)
  if (numRows === 1 && numCols === 1) {
    const key = columns[0];
    const val = data[0][key];
    const label = snakeToLabel(key);
    const formatted = formatCellValue(val, kinds[key]);
    return `The **${label.toLowerCase()}** is **${formatted}**.`;
  }

  // CASE 2: Single row, multiple columns
  if (numRows === 1) {
    const lines: string[] = ["Here are the details:\n"];
    for (const col of columns) {
      const val = data[0][col];
      const formatted = formatCellValue(val, kinds[col]);
      lines.push(`- **${snakeToLabel(col)}**: ${formatted}`);
    }
    return lines.join("\n");
  }

  const currencyCols = columns.filter((c) => kinds[c] === "currency");
  const countCols = columns.filter((c) => kinds[c] === "count");
  const percentCols = columns.filter((c) => kinds[c] === "percentage");
  const dateCols = columns.filter((c) => kinds[c] === "date");
  const nameCols = columns.filter((c) => kinds[c] === "name" || kinds[c] === "text");
  const idCols = columns.filter((c) => kinds[c] === "id");
  const numericCols = columns.filter((c) => kinds[c] === "numeric" || kinds[c] === "currency" || kinds[c] === "count");

  const labelCol = nameCols[0] || idCols[0] || columns[0];
  const metricCol = currencyCols[0] || countCols[0] || numericCols[0] || percentCols[0];
  const heading = generateHeading(question);

  // CASE 3: Time series (date column + metric)
  if (dateCols.length > 0 && metricCol && numericCols.length > 0) {
    const sorted = [...data].sort((a, b) => String(a[dateCols[0]] ?? "").localeCompare(String(b[dateCols[0]] ?? "")));
    const values = sorted.map((r) => Number(r[metricCol]) || 0);
    const peakIdx = values.indexOf(Math.max(...values));
    const lowIdx = values.indexOf(Math.min(...values));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values[values.length - 1] >= values[0] ? "upward" : "downward";

    const lines: string[] = [heading, ""];
    lines.push(`The data shows an **${trend} trend** over ${sorted.length} periods.\n`);
    lines.push(`- **Peak**: ${formatCellValue(sorted[peakIdx][dateCols[0]], kinds[dateCols[0]])} — ${formatCellValue(sorted[peakIdx][metricCol], kinds[metricCol])}`);
    lines.push(`- **Lowest**: ${formatCellValue(sorted[lowIdx][dateCols[0]], kinds[dateCols[0]])} — ${formatCellValue(sorted[lowIdx][metricCol], kinds[metricCol])}`);
    lines.push(`- **Average**: ${formatCellValue(avg, kinds[metricCol])}`);

    if (sorted.length <= 25) {
      lines.push("");
      lines.push(`| ${snakeToLabel(dateCols[0])} | ${snakeToLabel(metricCol)} |`);
      lines.push("|---|---|");
      for (const row of sorted) {
        lines.push(`| ${formatCellValue(row[dateCols[0]], kinds[dateCols[0]])} | ${formatCellValue(row[metricCol], kinds[metricCol])} |`);
      }
    }
    return lines.join("\n");
  }

  // CASE 4: Distribution / Grouped (label + metric, <= 20 categories)
  if (labelCol && metricCol && labelCol !== metricCol && numRows <= 20 && nameCols.length > 0) {
    const total = data.reduce((sum, r) => sum + (Number(r[metricCol]) || 0), 0);
    const sorted = [...data].sort((a, b) => (Number(b[metricCol]) || 0) - (Number(a[metricCol]) || 0));

    const lines: string[] = [heading, ""];
    const extraCols = columns.filter((c) => c !== labelCol && c !== metricCol && kinds[c] !== "id");
    const headers = [snakeToLabel(labelCol), snakeToLabel(metricCol)];
    if (total > 0) headers.push("Share");
    for (const ec of extraCols) headers.push(snakeToLabel(ec));

    lines.push(`| ${headers.join(" | ")} |`);
    lines.push(`|${headers.map(() => "---").join("|")}|`);

    for (const row of sorted) {
      const metricVal = Number(row[metricCol]) || 0;
      const cells = [
        String(row[labelCol] ?? "—"),
        formatCellValue(row[metricCol], kinds[metricCol]),
      ];
      if (total > 0) cells.push(`${((metricVal / total) * 100).toFixed(1)}%`);
      for (const ec of extraCols) cells.push(formatCellValue(row[ec], kinds[ec]));
      lines.push(`| ${cells.join(" | ")} |`);
    }

    if (sorted.length >= 2 && total > 0) {
      const topLabel = String(sorted[0][labelCol]);
      const topShare = ((Number(sorted[0][metricCol]) || 0) / total) * 100;
      if (topShare > 30) {
        lines.push("");
        lines.push(`**${topLabel}** leads with **${topShare.toFixed(1)}%** of the total.`);
      }
    }
    return lines.join("\n");
  }

  // CASE 5: Rankings / Lists (e.g. Top 5 most expensive orders)
  const MAX_DISPLAY = 20;
  const displayData = data.slice(0, MAX_DISPLAY);
  const lines: string[] = [heading, ""];

  for (let i = 0; i < displayData.length; i++) {
    const row = displayData[i];
    lines.push(`${i + 1}.`);

    for (const col of columns) {
      const val = row[col];
      const kind = kinds[col];
      const label = snakeToLabel(col);
      const formatted = formatCellValue(val, kind);

      if (kind === "id") {
        lines.push(`${label}:`);
        lines.push(`\`${String(val)}\``);
      } else {
        lines.push(`${label}:`);
        lines.push(`**${formatted}**`);
      }
      lines.push("");
    }
  }

  if (numRows > MAX_DISPLAY) {
    lines.push(`...and ${numRows - MAX_DISPLAY} more rows.`);
  }

  return lines.join("\n").trim();
}

// ==========================================
// AUTOMATED INSIGHTS GENERATOR
// ==========================================

function buildInsights(
  data: Record<string, unknown>[],
  columns: string[],
  kinds: Record<string, ColumnKind>
): string[] {
  if (!data || data.length < 2) return [];

  const insights: string[] = [];
  const numericCols = columns.filter(
    (c) => kinds[c] === "numeric" || kinds[c] === "currency" || kinds[c] === "count" || kinds[c] === "percentage"
  );
  const nameCols = columns.filter((c) => kinds[c] === "name" || kinds[c] === "text" || kinds[c] === "id");

  if (numericCols.length === 0) return [];

  const primaryMetric = numericCols[0];
  const primaryName = nameCols[0];
  const metricLabel = snakeToLabel(primaryMetric);

  const values = data.map((r) => Number(r[primaryMetric]) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / values.length;
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  const maxRow = data.find((r) => (Number(r[primaryMetric]) || 0) === maxVal);
  const minRow = data.find((r) => (Number(r[primaryMetric]) || 0) === minVal);

  const maxEntity = primaryName && maxRow ? String(maxRow[primaryName]) : null;
  const minEntity = primaryName && minRow ? String(minRow[primaryName]) : null;

  // 1. Total sum & Average
  if (kinds[primaryMetric] === "currency" || kinds[primaryMetric] === "count" || kinds[primaryMetric] === "numeric") {
    const formattedTotal = formatCellValue(total, kinds[primaryMetric]);
    const formattedAvg = formatCellValue(avg, kinds[primaryMetric]);
    insights.push(`Total ${metricLabel} across ${data.length} records is ${formattedTotal} (Average: ${formattedAvg}).`);
  }

  // 2. Top Performer
  if (maxRow && maxEntity) {
    const formattedMax = formatCellValue(maxVal, kinds[primaryMetric]);
    const shareStr = total > 0 ? ` (${((maxVal / total) * 100).toFixed(1)}% of total)` : "";
    insights.push(`Highest ${metricLabel}: ${maxEntity} with ${formattedMax}${shareStr}.`);
  }

  // 3. Bottom Performer
  if (minRow && minEntity && minEntity !== maxEntity) {
    const formattedMin = formatCellValue(minVal, kinds[primaryMetric]);
    insights.push(`Lowest ${metricLabel}: ${minEntity} with ${formattedMin}.`);
  }

  return insights;
}

// ==========================================
// AUTOMATED CHART PAYLOAD GENERATOR
// ==========================================

function buildChart(
  data: Record<string, unknown>[],
  columns: string[],
  kinds: Record<string, ColumnKind>,
  question: string
): ChartPayload | null {
  if (!data || data.length < 2) return null;

  const isExplicitChart = /chart|graph|plot|visualize|bar|pie|line|scatter|hbar|area|donut/i.test(question);

  const timeCols = columns.filter((c) => kinds[c] === "date");
  const numericCols = columns.filter((c) => kinds[c] === "numeric" || kinds[c] === "currency" || kinds[c] === "count" || kinds[c] === "percentage");
  const stringCols = columns.filter((c) => kinds[c] === "name" || kinds[c] === "text" || kinds[c] === "id");

  if (numericCols.length === 0) return null;

  let chartType: ChartType | null = null;
  let xKey: string = "";
  let yCols: string[] = [];

  // Rule 1: Time Series -> Line or Area
  if (timeCols.length > 0) {
    xKey = timeCols[0];
    yCols = numericCols;
    chartType = /area/i.test(question) ? "area" : "line";
  }
  // Rule 2: Categorical + Numeric
  else if (stringCols.length > 0 && numericCols.length > 0) {
    xKey = stringCols[0];
    yCols = numericCols;

    const uniqueCategories = new Set(data.map((r) => String(r[xKey]))).size;

    if (/pie|donut/i.test(question) || (uniqueCategories <= 6 && numericCols.length === 1)) {
      chartType = "pie";
    } else if (uniqueCategories > 15) {
      chartType = "hbar";
    } else {
      chartType = "bar";
    }
  }
  // Rule 3: Two Numeric Columns -> Scatter
  else if (numericCols.length >= 2) {
    xKey = numericCols[0];
    yCols = [numericCols[1]];
    chartType = "scatter";
  }

  // Explicit type override from question
  if (isExplicitChart && chartType) {
    if (/bar chart|bar graph/i.test(question)) chartType = "bar";
    if (/pie chart|pie graph/i.test(question)) chartType = "pie";
    if (/line chart|line graph/i.test(question)) chartType = "line";
    if (/scatter/i.test(question)) chartType = "scatter";
    if (/area/i.test(question)) chartType = "area";
  }

  if (!chartType || !xKey || yCols.length === 0) return null;

  const series = yCols.slice(0, 3).map((key, idx) => ({
    key,
    label: snakeToLabel(key),
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  const cleanData = data.slice(0, 30).map((row) => {
    const cleaned: Record<string, string | number> = {};
    for (const c of columns) {
      const val = row[c];
      if (val === null || val === undefined) {
        cleaned[c] = 0;
      } else if (typeof val === "number") {
        cleaned[c] = val;
      } else if (typeof val === "string" && !isNaN(Number(val)) && numericCols.includes(c)) {
        cleaned[c] = Number(val);
      } else {
        cleaned[c] = String(val);
      }
    }
    return cleaned;
  });

  return {
    type: chartType,
    title: generateHeading(question).replace(/^##\s*/, ""),
    xKey,
    series,
    data: cleanData,
  };
}

// ==========================================
// UNIVERSAL RESPONSE FORMATTER ENTRY POINT
// ==========================================

export function formatResponse(
  question: string,
  response: AskResponse
): FormattedResponse {
  const data = response.result?.data ?? [];
  const rawColumns = response.result?.columns;
  const columns =
    rawColumns && rawColumns.length > 0
      ? rawColumns
      : data.length > 0
      ? Object.keys(data[0])
      : [];

  // Classify all columns
  const kinds: Record<string, ColumnKind> = {};
  for (const col of columns) {
    const samples = data.slice(0, 20).map((row) => row[col]);
    kinds[col] = classifyColumn(col, samples);
  }

  // 1. Build Natural Markdown Content
  const content = buildMarkdownContent(data, columns, kinds, question);

  // 2. Build SQL Payload
  const sql: SqlPayload | undefined = response.sql
    ? {
        sql: response.sql,
        executionMs: response.summary?.execution_time_ms ?? 0,
        rowCount: response.result?.row_count ?? data.length,
        tables: response.tables_used ?? [],
        method: response.summary?.method,
        fromCache: response.summary?.from_cache,
      }
    : undefined;

  // 3. Build Table Payload
  const table: TablePayload | undefined =
    data.length > 0 && columns.length > 0
      ? {
          columns,
          rows: data.map((row) =>
            columns.map((col) => {
              const val = row[col];
              if (val === null || val === undefined) return "";
              if (typeof val === "number") return val;
              if (typeof val === "boolean") return val ? "Yes" : "No";
              return String(val);
            })
          ),
        }
      : undefined;

  // 4. Build Chart Payload (use backend chart if provided, otherwise auto-generate)
  const chart: ChartPayload | null =
    response.chart ?? buildChart(data, columns, kinds, question);

  // 5. Build Insights (use backend insights if provided, otherwise auto-generate)
  const insights: string[] =
    response.insights && response.insights.length > 0
      ? response.insights
      : buildInsights(data, columns, kinds);

  return {
    content,
    sql,
    table,
    chart,
    insights,
  };
}
