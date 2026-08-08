import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import type { Message } from "@/types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ProcessSteps, TypingIndicator } from "./ProcessSteps";
import { SQLCard } from "@/components/cards/SQLCard";
import { ChartCard } from "@/components/cards/ChartCard";
import { MermaidCard } from "@/components/cards/MermaidCard";
import { InsightCard } from "@/components/cards/InsightCard";
import { DataTableCard } from "@/components/cards/DataTableCard";
import { ErrorCard } from "@/components/cards/ErrorCard";
import { ExportButtons } from "@/components/export/ExportButtons";
import { BrandMark } from "@/components/layout/BrandMark";
import { cn } from "@/lib/utils";

interface Props {
  message: Message;
  onRegenerate: () => void;
  onEdit: (text: string) => void;
  onFeedback: (value: "up" | "down") => void;
}

export function MessageBubble({
  message,
  onRegenerate,
  onEdit,
  onFeedback,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.content) {
      onEdit(editText.trim());
    }
    setEditing(false);
  };

  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex justify-end gap-3"
      >
        <div className="flex max-w-[85%] flex-col items-end gap-1">
          {editing ? (
            <div className="w-full space-y-2 rounded-2xl border border-border bg-card p-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full resize-none bg-transparent text-sm focus:outline-none"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                >
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {message.content}
            </div>
          )}
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <Action label="Edit prompt" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
            </Action>
          </div>
        </div>
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-secondary text-muted-foreground">
          <User className="size-4" />
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-3"
    >
      <BrandMark className="mt-0.5 size-8 shrink-0" />
      <div className="min-w-0 flex-1 space-y-3">
        {message.streaming && message.steps && (
          <ProcessSteps steps={message.steps} />
        )}

        {message.content ? (
          <div className="relative">
            <MarkdownRenderer content={message.content} />
            {message.streaming && (
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary [animation:caret-blink_1s_step-end_infinite]" />
            )}
          </div>
        ) : (
          message.streaming &&
          !message.steps?.some((s) => s.status !== "pending") && (
            <TypingIndicator />
          )
        )}

        {message.error && (
          <ErrorCard payload={message.error} onRetry={onRegenerate} />
        )}
        {message.insights && message.insights.length > 0 && (
          <InsightCard insights={message.insights} />
        )}
        {message.sql && <SQLCard payload={message.sql} />}
        {message.table && <DataTableCard payload={message.table} />}
        {message.chart && <ChartCard payload={message.chart} />}
        {message.mermaid && (
          <MermaidCard title={message.mermaid.title} code={message.mermaid.code} />
        )}

        {!message.streaming && (message.table || message.sql) && (
          <ExportButtons table={message.table} sql={message.sql} />
        )}

        {!message.streaming && (
          <div className="flex items-center gap-0.5 pt-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Action label="Copy response" onClick={handleCopy}>
              {copied ? (
                <Check className="size-3.5 text-[var(--color-success)]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Action>
            <Action label="Regenerate response" onClick={onRegenerate}>
              <RefreshCw className="size-3.5" />
            </Action>
            <Action
              label="Good response"
              onClick={() => onFeedback("up")}
              active={message.feedback === "up"}
            >
              <ThumbsUp className="size-3.5" />
            </Action>
            <Action
              label="Bad response"
              onClick={() => onFeedback("down")}
              active={message.feedback === "down"}
            >
              <ThumbsDown className="size-3.5" />
            </Action>
            {message.tokens && (
              <span className="ml-2 text-[11px] text-muted-foreground">
                {message.tokens.prompt + message.tokens.completion} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Action({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-accent text-foreground font-semibold"
      )}
    >
      {children}
    </button>
  );
}
