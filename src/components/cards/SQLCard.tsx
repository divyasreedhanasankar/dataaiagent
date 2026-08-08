import { useState } from "react";
import { Check, Copy, Download, Database, Timer, Rows3, Zap, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SqlPayload {
  sql: string;
  executionMs: number;
  rowCount: number;
  tables: string[];
  method?: "template" | "gemini" | "error";
  fromCache?: boolean;
}

const KEYWORDS =
  /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP BY|ORDER BY|LIMIT|SUM|COUNT|AVG|MIN|MAX|AS|ON|AND|OR|NOT|NULL|DESC|ASC|DATE_TRUNC|INTERVAL|NOW|FILTER|CASE|WHEN|THEN|ELSE|END|DISTINCT|HAVING|IN|BETWEEN)\b/g;

function highlight(sql: string) {
  const escaped = sql
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/('[^']*')/g, '<span class="text-[var(--color-success)]">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-[var(--color-warning)]">$1</span>')
    .replace(KEYWORDS, '<span class="text-[var(--color-violet)] font-semibold">$&</span>')
    .replace(/(--[^\n]*)/g, '<span class="text-muted-foreground italic">$1</span>');
}

export function SQLCard({ payload }: { payload: SqlPayload }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(payload.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob([payload.sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "datamind-query.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-lg shadow-black/20"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
            <Database className="size-3.5" />
          </span>
          <span className="truncate text-xs font-semibold tracking-wide text-foreground">
            Generated SQL
          </span>
          
          {payload.method === "template" && (
            <span className="flex items-center gap-1 rounded-md bg-[var(--color-success)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
              <Zap className="size-3" /> Template
            </span>
          )}
          {payload.method === "gemini" && (
            <span className="flex items-center gap-1 rounded-md bg-[var(--color-violet)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-violet)]">
              <Bot className="size-3" /> Gemini
            </span>
          )}
          {payload.fromCache && (
            <span className="flex items-center gap-1 rounded-md bg-[var(--color-warning)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">
              <Zap className="size-3" /> Cached
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn label="Copy SQL" onClick={copy}>
            {copied ? <Check className="size-3.5 text-[var(--color-success)]" /> : <Copy className="size-3.5" />}
          </IconBtn>
          <IconBtn label="Download SQL" onClick={download}>
            <Download className="size-3.5" />
          </IconBtn>
        </div>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlight(payload.sql) }} />
      </pre>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Timer className="size-3" /> {payload.executionMs} ms
        </span>
        <span className="flex items-center gap-1.5">
          <Rows3 className="size-3" /> {payload.rowCount} rows
        </span>
        <span className="truncate">tables: {payload.tables.join(", ")}</span>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-all",
        "hover:bg-accent hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      {children}
    </button>
  );
}
