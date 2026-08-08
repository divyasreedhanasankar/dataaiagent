/**
 * Client-side export utilities for DataMind AI.
 * Generate and download CSV, JSON, and SQL files from analysis results.
 */

function downloadBlob(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV(
  columns: string[],
  rows: (string | number)[][],
  filename = "datamind-result.csv"
) {
  const escape = (val: string | number) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map(escape).join(",");
  const body = rows.map((row) => row.map(escape).join(",")).join("\n");
  const csv = `${header}\n${body}`;

  downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

export function exportJSON(
  columns: string[],
  rows: (string | number)[][],
  filename = "datamind-result.json"
) {
  const data = rows.map((row) => {
    const obj: Record<string, string | number> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, "application/json", filename);
}

export function exportSQL(sql: string, filename = "datamind-query.sql") {
  downloadBlob(sql, "text/plain", filename);
}
