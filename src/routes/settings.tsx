import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Cpu, Download, Info, Keyboard, Palette, Wifi } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useChatStore } from "@/stores/chat-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DataMind AI" },
      {
        name: "description",
        content: "Configure theme, AI provider and model, check API status and export your data.",
      },
      { property: "og:title", content: "Settings — DataMind AI" },
      {
        property: "og:description",
        content: "Configure theme, AI provider and model, check API status and export your data.",
      },
    ],
  }),
  component: SettingsPage,
});

const MODELS = ["DataMind-1 Pro", "DataMind-1 Flash", "DataMind-1 Reasoning"];
const SHORTCUTS = [
  ["Enter", "Send message"],
  ["Shift + Enter", "New line"],
  ["⌘ / Ctrl + K", "Search conversations"],
  ["⌘ / Ctrl + N", "New chat"],
  ["Esc", "Stop generation"],
];

function SettingsPage() {
  const { model, setModel, provider, conversations } = useChatStore();

  const exportJson = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(conversations, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "datamind-conversations.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell showContext={false}>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Workspace preferences for DataMind AI.
            </p>
          </motion.header>

          <div className="space-y-4">
            <Card icon={Palette} title="Appearance">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Theme</span>
                <span className="rounded-lg border border-primary/40 bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
                  Midnight (dark)
                </span>
              </div>
            </Card>

            <Card icon={Cpu} title="AI provider">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Provider</span>
                <span className="text-xs font-medium">{provider}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition-all active:scale-95 ${
                      m === model
                        ? "border-primary/50 bg-primary/12 text-foreground"
                        : "border-border bg-background/40 text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="truncate">{m}</span>
                    {m === model && <Check className="size-3.5 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            </Card>

            <Card icon={Wifi} title="API status">
              {[
                ["Inference gateway", "Operational"],
                ["Query executor", "Operational"],
                ["Schema indexer", "Operational"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="flex items-center gap-1.5 text-[var(--color-success)]">
                    <span className="size-1.5 rounded-full bg-[var(--color-success)]" /> {status}
                  </span>
                </div>
              ))}
            </Card>

            <Card icon={Download} title="Export">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportJson}
                  className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs transition-all hover:bg-accent active:scale-95"
                >
                  Export conversations (JSON)
                </button>
                <button
                  onClick={() => window.print()}
                  className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs transition-all hover:bg-accent active:scale-95"
                >
                  Print report
                </button>
              </div>
            </Card>

            <Card icon={Keyboard} title="Keyboard shortcuts">
              {SHORTCUTS.map(([keys, action]) => (
                <div key={keys} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-muted-foreground">{action}</span>
                  <kbd className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px]">
                    {keys}
                  </kbd>
                </div>
              ))}
            </Card>

            <Card icon={Info} title="About">
              <p className="text-xs leading-relaxed text-muted-foreground">
                DataMind AI v1.0 — a conversational database intelligence platform that turns natural
                language into SQL, visualizations, diagrams and business insights.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/50 p-4"
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {title}
      </h2>
      {children}
    </motion.section>
  );
}
