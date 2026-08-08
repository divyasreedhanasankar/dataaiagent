import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  HardDrive,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  MessageSquare,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence as UploadPresence } from "framer-motion";
import { DatasetUploader } from "@/components/upload/DatasetUploader";
import { useActiveDatabase, useChatStore } from "@/stores/chat-store";
import { FAVORITE_QUERIES } from "@/lib/mock-data";
import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/utils";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { conversations, activeId, newConversation, selectConversation, deleteConversation, togglePin, send } =
    useChatStore();
  const database = useActiveDatabase();
  const [query, setQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );
  const pinned = filtered.filter((c) => c.pinned);
  const recent = filtered.filter((c) => !c.pinned);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <BrandMark className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">DataMind AI</p>
          <p className="truncate text-[11px] text-muted-foreground">Database Intelligence</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="px-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={newConversation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[var(--color-violet)] px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> New chat
        </motion.button>

        <button
          onClick={() => setShowUpload(true)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-background/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-foreground"
        >
          <Upload className="size-3.5" /> Upload Dataset
        </button>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="w-full rounded-xl border border-sidebar-border bg-background/40 py-2 pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>
      </div>

      <nav className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {pinned.length > 0 && (
          <Section label="Pinned">
            {pinned.map((c) => (
              <ConversationRow
                key={c.id}
                title={c.title}
                active={c.id === activeId && pathname === "/"}
                pinned
                onSelect={() => selectConversation(c.id)}
                onPin={() => togglePin(c.id)}
                onDelete={() => deleteConversation(c.id)}
              />
            ))}
          </Section>
        )}

        <Section label="Recent">
          {recent.map((c) => (
            <ConversationRow
              key={c.id}
              title={c.title}
              active={c.id === activeId && pathname === "/"}
              onSelect={() => selectConversation(c.id)}
              onPin={() => togglePin(c.id)}
              onDelete={() => deleteConversation(c.id)}
            />
          ))}
          {recent.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground">No conversations found.</p>
          )}
        </Section>

        <Section label="Favorite queries">
          {FAVORITE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Star className="size-3.5 shrink-0 text-[var(--color-warning)]" />
              <span className="truncate">{q}</span>
            </button>
          ))}
        </Section>

        <Section label="Workspace">
          <SideLink to="/database" active={pathname === "/database"} icon={Database} label="Databases" />
          <SideLink to="/settings" active={pathname === "/settings"} icon={Settings} label="Settings" />
        </Section>
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-3">
        <div className="rounded-xl border border-sidebar-border bg-background/40 p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Database className="size-3" /> {database.name}
            </span>
            <StatusDot status={database.status} />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <HardDrive className="size-3" /> Storage
            </span>
            <span>3.4 / 10 GB</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[34%] rounded-full bg-gradient-to-r from-primary to-[var(--color-cyan)]" />
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--color-cyan)] to-primary text-xs font-semibold text-primary-foreground">
            AM
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">Ava Mehta</p>
            <p className="truncate text-[11px] text-muted-foreground">Pro workspace</p>
          </div>
          <Link
            to="/settings"
            aria-label="Open settings"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
      <UploadPresence>
        {showUpload && <DatasetUploader onClose={() => setShowUpload(false)} />}
      </UploadPresence>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SideLink({
  to,
  active,
  icon: Icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: typeof Database;
  label: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
        active
          ? "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ConversationRow({
  title,
  active,
  pinned,
  onSelect,
  onPin,
  onDelete,
}: {
  title: string;
  active: boolean;
  pinned?: boolean;
  onSelect: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg pr-1 transition-colors",
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
      )}
    >
      <Link
        to="/"
        onClick={onSelect}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs",
          active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        <MessageSquare className="size-3.5 shrink-0" />
        <span className="truncate">{title}</span>
      </Link>
      <button
        onClick={onPin}
        aria-label={pinned ? "Unpin conversation" : "Pin conversation"}
        className="hidden size-6 place-items-center rounded text-muted-foreground hover:text-foreground group-hover:grid"
      >
        {pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete conversation"
        className="hidden size-6 place-items-center rounded text-muted-foreground hover:text-destructive group-hover:grid"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

export function StatusDot({ status }: { status: "connected" | "idle" | "error" }) {
  const map = {
    connected: { color: "bg-[var(--color-success)]", label: "Connected" },
    idle: { color: "bg-[var(--color-warning)]", label: "Idle" },
    error: { color: "bg-destructive", label: "Error" },
  }[status];

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="relative flex size-2">
        <AnimatePresence>
          <motion.span
            key={status}
            className={cn("absolute inline-flex size-full rounded-full opacity-60", map.color)}
            animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </AnimatePresence>
        <span className={cn("relative inline-flex size-2 rounded-full", map.color)} />
      </span>
      {map.label}
    </span>
  );
}
