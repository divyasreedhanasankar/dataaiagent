import { motion } from "framer-motion";
import { Lightbulb, Sparkle } from "lucide-react";

interface Props {
  insights: string[];
}

export function InsightCard({ insights }: Props) {
  if (!insights || insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-5 shadow-lg shadow-black/20"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 aurora opacity-60" />
      <div className="relative">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Lightbulb className="size-4" />
            </span>
            <h4 className="text-sm font-semibold">AI insights</h4>
          </div>
        </div>

        <ul className="space-y-2.5">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
              <Sparkle className="mt-0.5 size-4 shrink-0 text-[var(--color-violet)]" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
