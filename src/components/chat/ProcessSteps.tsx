import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { ProcessStep } from "@/types";

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  const visible = steps.filter((s) => s.status !== "pending").slice(-4);
  if (!visible.length) return null;

  return (
    <div className="mb-3 space-y-1.5 rounded-2xl border border-border bg-card/50 p-3.5">
      {visible.map((step) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 text-xs"
        >
          {step.status === "done" ? (
            <span className="grid size-4 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
              <Check className="size-2.5" />
            </span>
          ) : (
            <Loader2 className="size-4 animate-spin text-primary" />
          )}
          <span className={step.status === "done" ? "text-muted-foreground" : "shimmer-text font-medium"}>
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card/50 p-4">
      <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}
