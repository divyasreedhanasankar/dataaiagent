/**
 * ai-engine.ts — UI Process Animation & Utility Helpers
 *
 * All response formatting has been moved to src/lib/response-formatter.ts.
 * This module only contains non-formatting UI helpers (processSteps, titleFor).
 */

import type { ProcessStep } from "@/types";

// ==========================================
// PROCESS STEPS (real pipeline labels)
// ==========================================

const PROCESS_LABELS = [
  "Understanding question",
  "Detecting intent",
  "Generating SQL",
  "Executing query",
  "Analyzing results",
  "Generating insights",
  "Preparing visualization",
];

export const processSteps = (): ProcessStep[] =>
  PROCESS_LABELS.map((label, i) => ({
    label,
    status: (i === 0 ? "active" : "pending") as "pending" | "active" | "done",
  }));

// ==========================================
// TITLE GENERATION
// ==========================================

export function titleFor(question: string): string {
  const clean = question.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
}
