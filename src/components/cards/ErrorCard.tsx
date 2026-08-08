import { motion } from "framer-motion";
import { AlertOctagon, RefreshCw } from "lucide-react";
import type { ErrorPayload } from "@/types";

export function ErrorCard({ payload, onRetry }: { payload: ErrorPayload; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-destructive/40 bg-destructive/8 p-4 shadow-lg shadow-black/20"
    >
      <div className="flex gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
          <AlertOctagon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">{payload.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{payload.message}</p>
          {payload.hint && (
            <p className="mt-2 rounded-lg bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
              {payload.hint}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent active:scale-95"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
