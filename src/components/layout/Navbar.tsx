import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Cpu, Database, Menu, PanelRight, Settings, Sparkles } from "lucide-react";
import { useActiveDatabase, useChatStore } from "@/stores/chat-store";
import { DATABASES } from "@/lib/mock-data";
import { StatusDot } from "./Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODELS = ["DataMind-1 Pro", "DataMind-1 Flash", "DataMind-1 Reasoning"];

export function Navbar({
  onOpenSidebar,
  onToggleContext,
}: {
  onOpenSidebar: () => void;
  onToggleContext: () => void;
}) {
  const database = useActiveDatabase();
  const { provider, model, setModel, setDatabase } = useChatStore();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/70 px-3 backdrop-blur-xl">
      <button
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
        className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <Database className="size-3.5 shrink-0 text-primary" />
          <span className="truncate font-medium">{database.name}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs">Connected databases</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DATABASES.map((db) => (
            <DropdownMenuItem key={db.id} onClick={() => setDatabase(db.id)} className="gap-2 text-xs">
              <Database className="size-3.5" />
              <span className="flex-1 truncate">{db.name}</span>
              <span className="text-[10px] text-muted-foreground">{db.engine}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden items-center gap-2 md:flex">
        <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-[var(--color-violet)]" /> {provider}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <Cpu className="size-3.5 text-[var(--color-cyan)]" />
            <span className="font-medium">{model}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {MODELS.map((m) => (
              <DropdownMenuItem key={m} onClick={() => setModel(m)} className="text-xs">
                {m}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <span className="mr-1 hidden sm:block">
          <StatusDot status={database.status} />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              "3 products went out of stock today",
              "Query cache rebuilt in 1.4s",
              "New schema version detected on commerce_analytics",
            ].map((n) => (
              <DropdownMenuItem key={n} className="text-xs leading-relaxed">
                {n}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          to="/settings"
          aria-label="Settings"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings className="size-4" />
        </Link>
        <button
          onClick={onToggleContext}
          aria-label="Toggle context panel"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelRight className="size-4" />
        </button>
      </div>
    </header>
  );
}
