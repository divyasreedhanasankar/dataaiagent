import { motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  Database,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import { EXAMPLE_PROMPTS, QUICK_ACTIONS } from "@/lib/mock-data";
import { BrandMark } from "@/components/layout/BrandMark";

const ICONS = {
  TrendingUp,
  Users,
  Boxes,
  ShoppingCart,
  Package,
  DollarSign,
  Database,
  BarChart3,
} as const;

export function PromptSuggestions({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 -z-10 blur-3xl aurora" />
          <BrandMark className="size-16 rounded-2xl" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Talk to your data, <span className="gradient-text">not your schema</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          DataMind AI understands plain-language questions, writes the SQL, runs it against your
          connected database and returns charts, diagrams and business insights.
        </p>
      </motion.div>

      <div className="mt-9 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = ICONS[action.icon];
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPick(action.prompt)}
              className="group rounded-2xl border border-border bg-card/50 p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-card"
            >
              <span className="mb-2 grid size-8 place-items-center rounded-lg bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="size-4" />
              </span>
              <p className="text-xs font-medium leading-tight">{action.label}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Try asking
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i }}
              onClick={() => onPick(prompt)}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/30 px-3.5 py-2.5 text-left text-sm text-foreground/85 transition-all hover:border-primary/40 hover:bg-card hover:text-foreground"
            >
              <span className="truncate">{prompt}</span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
