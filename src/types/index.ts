export type MessageRole = "user" | "assistant" | "system";

export type ChartType = "bar" | "line" | "pie" | "area" | "scatter" | "hbar" | "donut";

export interface ChartPayload {
  type: ChartType;
  title: string;
  subtitle?: string;
  xKey: string;
  series: { key: string; label: string; color: string }[];
  data: Record<string, string | number>[];
}

export interface TablePayload {
  columns: string[];
  rows: (string | number)[][];
}

export interface SqlPayload {
  sql: string;
  executionMs: number;
  rowCount: number;
  tables: string[];
  method?: "template" | "gemini" | "error";
  fromCache?: boolean;
}

export interface ErrorPayload {
  title: string;
  message: string;
  hint?: string;
}

export interface ProcessStep {
  label: string;
  status: "pending" | "active" | "done";
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  streaming?: boolean;
  steps?: ProcessStep[];
  sql?: SqlPayload;
  table?: TablePayload;
  chart?: ChartPayload;
  mermaid?: { title: string; code: string };
  insights?: string[];
  error?: ErrorPayload;
  tokens?: { prompt: number; completion: number };
  feedback?: "up" | "down" | null;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  messages: Message[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  primaryKey?: boolean;
  foreignKey?: string;
  nullable?: boolean;
}

export interface TableSchema {
  name: string;
  description: string;
  rows: number;
  columns: ColumnSchema[];
}

export type DatabaseEngine = "SQLite" | "MySQL" | "PostgreSQL" | "MongoDB";

export interface DatabaseInfo {
  id: string;
  name: string;
  engine: DatabaseEngine;
  host: string;
  size: string;
  latencyMs: number;
  status: "connected" | "idle" | "error";
  tables: TableSchema[];
}
