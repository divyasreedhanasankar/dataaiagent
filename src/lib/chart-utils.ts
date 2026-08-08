/**
 * chart-utils.ts — Chart Utilities (SIMPLIFIED)
 *
 * The chart type decision engine has been moved to the backend
 * (backend/app/services/chart_engine.py).
 *
 * This file only contains shared chart constants used by ChartCard.tsx.
 *
 * REMOVED: detectChart() — backend now provides chart metadata directly.
 */

// ==========================================
// CHART COLOR PALETTE
// ==========================================

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];
