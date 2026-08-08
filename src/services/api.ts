import type { ChartPayload } from "@/types";

const API_URL = "http://127.0.0.1:8000";

// ==========================================
// TYPES — matches backend response format
// ==========================================

export interface AskResponse {
  success: boolean;
  question?: string;
  sql: string;
  result: {
    columns?: string[] | null;
    data: Record<string, unknown>[];
    row_count: number;
  };
  // Optional fields — backend may or may not return these
  answer?: string;
  summary?: {
    rows?: number;
    execution_time_ms?: number;
    total_time_ms?: number;
    from_cache?: boolean;
    method?: "template" | "gemini" | "error";
  };
  chart?: ChartPayload | null;
  insights?: string[];
  tables_used?: string[];
}

export interface UploadResponse {
  success: boolean;
  table_name: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  columns: string[];
  preview: Record<string, unknown>[];
}

export interface DatasetInfo {
  table_name: string;
  row_count: number;
  column_count: number;
  columns: { name: string; type: string }[];
}

// ==========================================
// API ERROR CLASS
// ==========================================

export class ApiError extends Error {
  statusCode: number;
  userMessage: string;
  detail: string;
  errorType: string;

  constructor(
    statusCode: number,
    userMessage: string,
    detail: string = "",
    errorType: string = "unknown"
  ) {
    super(userMessage);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.detail = detail;
    this.errorType = errorType;
  }
}

// ==========================================
// ERROR PARSING
// ==========================================

function parseBackendError(status: number, body: string): ApiError {
  let detail = "";
  try {
    const parsed = JSON.parse(body);
    detail = parsed.detail || parsed.message || parsed.error || body;
  } catch {
    detail = body;
  }

  // Check for Gemini-specific errors
  if (detail.includes("quota") || detail.includes("429") || detail.includes("rate limit")) {
    return new ApiError(
      429,
      "AI request limit reached. Please try again later or update your Gemini API quota.",
      detail,
      "quota"
    );
  }

  if (detail.includes("model") && (detail.includes("not found") || detail.includes("unavailable"))) {
    return new ApiError(
      503,
      "The configured AI model is currently unavailable. Please update the backend model configuration.",
      detail,
      "model_unavailable"
    );
  }

  if (detail.includes("API key") || detail.includes("api_key") || detail.includes("GEMINI_API_KEY")) {
    return new ApiError(
      401,
      "AI service authentication failed. Please check the backend API key configuration.",
      detail,
      "auth"
    );
  }

  switch (status) {
    case 400:
      return new ApiError(400, `Invalid request: ${detail}`, detail, "bad_request");
    case 404:
      return new ApiError(404, "API endpoint not found. Please verify the backend is running.", detail, "not_found");
    case 422:
      return new ApiError(422, "Could not process the question. Please try rephrasing.", detail, "validation");
    case 429:
      return new ApiError(429, "Too many requests. Please wait a moment and try again.", detail, "rate_limit");
    case 500:
      if (detail.includes("no such table") || detail.includes("no such column")) {
        return new ApiError(500, "The database query referenced a table or column that doesn't exist.", detail, "sql_error");
      }
      if (detail.includes("syntax error") || detail.includes("SQL")) {
        return new ApiError(500, "The generated SQL query had a syntax error. Try rephrasing your question.", detail, "sql_error");
      }
      return new ApiError(500, "An internal error occurred while processing your question.", detail, "server");
    default:
      return new ApiError(status, `Unexpected error (${status}). Please try again.`, detail, "unknown");
  }
}

// ==========================================
// ASK QUESTION
// ==========================================

export async function askDataMind(
  question: string
): Promise<AskResponse> {
  console.log("➡️ Sending to DataMind:", question);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout (longer for Gemini retries)

    const response = await fetch(`${API_URL}/api/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question.trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("⬅️ Backend status:", response.status);

    const responseText = await response.text();

    if (!response.ok) {
      throw parseBackendError(response.status, responseText);
    }

    const data: AskResponse = JSON.parse(responseText);

    console.log("⬅️ DataMind response:", {
      success: data.success,
      method: data.summary?.method,
      rows: data.summary?.rows,
      totalMs: data.summary?.total_time_ms,
      cached: data.summary?.from_cache,
      hasChart: !!data.chart,
      insightCount: data.insights?.length,
    });

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("❌ DataMind API Error:", error.errorType, error.detail);
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        0,
        "Unable to connect to the DataMind AI backend. Make sure FastAPI is running at http://127.0.0.1:8000.",
        error.message,
        "connection"
      );
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        408,
        "The request timed out. The query may be too complex. Try a simpler question.",
        "Request aborted after 90s",
        "timeout"
      );
    }

    console.error("❌ DataMind API Error:", error);
    throw new ApiError(
      0,
      "An unexpected error occurred. Please try again.",
      error instanceof Error ? error.message : String(error),
      "unknown"
    );
  }
}

// ==========================================
// UPLOAD DATASET
// ==========================================

export async function uploadDataset(file: File): Promise<UploadResponse> {
  console.log("➡️ Uploading dataset:", file.name);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw parseBackendError(response.status, responseText);
    }

    const data: UploadResponse = JSON.parse(responseText);
    console.log("⬅️ Upload response:", data);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        0,
        "Unable to connect to the backend. Make sure FastAPI is running.",
        error.message,
        "connection"
      );
    }

    throw new ApiError(
      0,
      "Failed to upload dataset. Please try again.",
      error instanceof Error ? error.message : String(error),
      "upload_error"
    );
  }
}

// ==========================================
// GET DATASETS
// ==========================================

export async function getDatasets(): Promise<DatasetInfo[]> {
  try {
    const response = await fetch(`${API_URL}/api/datasets`);
    const responseText = await response.text();

    if (!response.ok) {
      throw parseBackendError(response.status, responseText);
    }

    const data = JSON.parse(responseText);
    return data.datasets || [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Failed to fetch datasets:", error);
    return [];
  }
}

// ==========================================
// DELETE DATASET
// ==========================================

export async function deleteDataset(tableName: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/datasets/${tableName}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw parseBackendError(response.status, responseText);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      0,
      "Failed to delete dataset.",
      error instanceof Error ? error.message : String(error),
      "unknown"
    );
  }
}