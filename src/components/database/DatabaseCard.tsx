import { motion } from "framer-motion";
import { Database, Gauge, HardDrive, Server } from "lucide-react";
import type { DatabaseInfo } from "@/types";
import { StatusDot } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

const ENGINE_TONE: Record<string, string> = {
  PostgreSQL: "from-primary/25 to-primary/5 text-primary",
  MySQL: "from-[var(--color-cyan)]/25 to-[var(--color-cyan)]/5 text-[var(--color-cyan)]",
  SQLite: "from-[var(--color-success)]/25 to-[var(--color-success)]/5 text-[var(--color-success)]",
  MongoDB: "from-[var(--color-violet)]/25 to-[var(--color-violet)]/5 text-[var(--color-violet)]",
};

export function DatabaseCard({
  db,
  active,
  onSelect,
}: {
  db: DatabaseInfo;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-primary/50 bg-card glow-primary"
          : "border-border bg-card/50 hover:border-primary/30 hover:bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br",
            ENGINE_TONE[db.engine],
          )}
        >
          <Database className="size-5" />
        </span>
        <StatusDot status={db.status} />
      </div>
      <p className="mt-3 truncate font-mono text-sm font-medium">{db.name}</p>
      <p className="truncate text-[11px] text-muted-foreground">{db.engine}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Server className="size-3" /> {db.tables.length} tbl
        </span>
        <span className="flex items-center gap-1">
          <HardDrive className="size-3" /> {db.size}
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="size-3" /> {db.latencyMs}ms
        </span>
      </div>
    </motion.button>
  );
}
