import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Coins,
  Database,
  LineChart,
  Table2,
  Timer,
  X,
  Zap,
  Cpu,
} from "lucide-react";
import { useActiveConversation, useActiveDatabase, useChatStore } from "@/stores/chat-store";

export function ContextPanel({ onClose }: { onClose?: () => void }) {
  const conversation = useActiveConversation();
  const database = useActiveDatabase();
  const model = useChatStore((s) => s.model);

  const last = [...conversation.messages].reverse().find((m) => m.role === "assistant" && !m.streaming);
  const tokens = conversation.messages.reduce(
    (sum, m) => sum + (m.tokens ? m.tokens.prompt + m.tokens.completion : 0),
    0,
  );

  return (
    <aside className="flex h-full w-80 flex-col overflow-y-auto border-l border-border bg-sidebar">
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-sm font-semibold">Context</h2>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close context panel"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="space-y-3 px-4 pb-6">
        <Panel icon={Brain} title="Conversation memory" tone="text-[var(--color-violet)]">
          <Row label="Turns" value={String(conversation.messages.length)} />
          <Row label="Model" value={model} />
          <Row label="Context window" value="128K tokens" />
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, conversation.messages.length * 7)}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-violet)] to-primary"
            />
          </div>
        </Panel>

        <Panel icon={Database} title="Current database" tone="text-primary">
          <Row label="Name" value={database.name} />
          <Row label="Engine" value={database.engine} />
          <Row label="Host" value={database.host} />
          <Row label="Latency" value={`${database.latencyMs} ms`} />
        </Panel>

        <Panel icon={Table2} title="Detected tables" tone="text-[var(--color-cyan)]">
          <div className="flex flex-wrap gap-1.5">
            {(last?.sql?.tables ?? database.tables.map((t) => t.name)).map((t) => (
              <span
                key={t}
                className="rounded-md border border-border bg-background/50 px-2 py-0.5 font-mono text-[11px] text-foreground/80"
              >
                {t}
              </span>
            ))}
          </div>
        </Panel>

        {last?.sql && (
          <Panel icon={Activity} title="Last query" tone="text-[var(--color-success)]">
            <pre className="max-h-40 overflow-auto rounded-lg bg-background/50 p-2.5 font-mono text-[11px] leading-relaxed text-foreground/80">
              {last.sql.sql}
            </pre>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stat icon={Timer} label="Execution" value={`${last.sql.executionMs} ms`} />
              <Stat icon={Table2} label="Rows" value={String(last.sql.rowCount)} />
            </div>
            {last.sql.method && (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Cpu className="size-3" /> Method
                </span>
                <span className="font-medium capitalize text-foreground">
                  {last.sql.method}
                </span>
              </div>
            )}
            {last.sql.fromCache !== undefined && (
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap className="size-3" /> Cache
                </span>
                <span className="font-medium text-foreground">
                  {last.sql.fromCache ? "Hit (0 ms)" : "Miss"}
                </span>
              </div>
            )}
          </Panel>
        )}

        {last?.chart && (
          <Panel icon={LineChart} title="Chart information" tone="text-[var(--color-warning)]">
            <Row label="Type" value={last.chart.type.toUpperCase()} />
            <Row label="Title" value={last.chart.title} />
            <Row label="Points" value={String(last.chart.data.length)} />
            <Row label="Series" value={String(last.chart.series.length)} />
          </Panel>
        )}

        <Panel icon={Coins} title="Token usage" tone="text-[var(--color-warning)]">
          <Row label="This conversation" value={tokens.toLocaleString()} />
          <Row label="Monthly quota" value="1,000,000" />
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-warning)] to-destructive"
              style={{ width: `${Math.min(100, (tokens / 20000) * 100)}%` }}
            />
          </div>
        </Panel>
      </div>
    </aside>
  );
}

function Panel({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: typeof Brain;
  title: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/50 p-3.5"
    >
      <h3 className={`mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${tone}`}>
        <Icon className="size-3.5" /> {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </motion.section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2">
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold">{value}</p>
    </div>
  );
}
