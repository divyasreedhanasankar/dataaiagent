import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, KeyRound, Link2, Rows3, Table2 } from "lucide-react";
import type { TableSchema } from "@/types";

export function SchemaExplorer({ tables }: { tables: TableSchema[] }) {
  const [open, setOpen] = useState<string | null>(tables[0]?.name ?? null);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {tables.map((table, i) => {
        const expanded = open === table.name;
        return (
          <motion.div
            key={table.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="h-fit overflow-hidden rounded-2xl border border-border bg-card/50 transition-colors hover:border-primary/35"
          >
            <button
              onClick={() => setOpen(expanded ? null : table.name)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Table2 className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-sm font-medium">{table.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{table.description}</span>
              </span>
              <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:flex">
                <Rows3 className="size-3" /> {table.rows.toLocaleString()}
              </span>
              <ChevronRight
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <ul className="divide-y divide-border/60">
                    {table.columns.map((col) => (
                      <li key={col.name} className="flex items-center gap-2 px-4 py-2 text-xs">
                        <span className="min-w-0 flex-1 truncate font-mono text-foreground/90">{col.name}</span>
                        <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {col.type}
                        </span>
                        {col.primaryKey && (
                          <span className="flex shrink-0 items-center gap-1 rounded-md bg-[var(--color-warning)]/15 px-1.5 py-0.5 text-[10px] text-[var(--color-warning)]">
                            <KeyRound className="size-2.5" /> PK
                          </span>
                        )}
                        {col.foreignKey && (
                          <span className="flex shrink-0 items-center gap-1 rounded-md bg-[var(--color-cyan)]/15 px-1.5 py-0.5 text-[10px] text-[var(--color-cyan)]">
                            <Link2 className="size-2.5" /> {col.foreignKey}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
