import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Mic, Paperclip, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    if (!isStreaming) ref.current?.focus();
  }, [isStreaming]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const submit = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue("");
    setAttachment(null);
    requestAnimationFrame(() => ref.current?.focus());
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      {attachment && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Paperclip className="size-3" /> {attachment}
          <button
            onClick={() => setAttachment(null)}
            aria-label="Remove attachment"
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-2 shadow-2xl shadow-black/40 transition-shadow focus-within:ring-2 focus-within:ring-primary/45"
      >
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          aria-label="Ask a question about your database"
          placeholder="Ask anything about your database…"
          className="max-h-[220px] w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex items-center gap-1">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? null)}
            />
            <Ghost label="Attach file" onClick={() => fileRef.current?.click()}>
              <Paperclip className="size-4" />
            </Ghost>
            <Ghost
              label="Voice input"
              active={listening}
              onClick={() => setListening((l) => !l)}
            >
              <Mic className={cn("size-4", listening && "text-destructive")} />
            </Ghost>
            <span className="ml-1 hidden text-[11px] text-muted-foreground sm:inline">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-sans">Enter</kbd> send ·{" "}
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-sans">Shift</kbd>+
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-sans">Enter</kbd> newline
            </span>
          </div>
          {isStreaming ? (
            <button
              onClick={onStop}
              aria-label="Stop generating"
              className="grid size-9 place-items-center rounded-full bg-secondary text-foreground transition-all hover:bg-accent active:scale-95"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim()}
              aria-label="Send message"
              className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-[var(--color-violet)] text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
      </motion.div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        DataMind AI generates SQL from natural language. Always review queries before running them in production.
      </p>
    </div>
  );
}

function Ghost({
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
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active && "bg-destructive/15",
      )}
    >
      {children}
    </button>
  );
}
