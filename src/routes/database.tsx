import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Database, RefreshCw, Server, Trash2, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DatabaseCard } from "@/components/database/DatabaseCard";
import { SchemaExplorer } from "@/components/database/SchemaExplorer";
import { DATABASES } from "@/lib/mock-data";
import { useActiveDatabase, useChatStore } from "@/stores/chat-store";
import { getDatasets, deleteDataset, type DatasetInfo } from "@/services/api";
import { toast } from "sonner";
import type { TableSchema } from "@/types";

export const Route = createFileRoute("/database")({
  head: () => ({
    meta: [
      { title: "Databases & Schema — DataMind AI" },
      {
        name: "description",
        content:
          "Browse connected PostgreSQL, MySQL, SQLite and MongoDB databases, inspect tables, columns, keys and relationships.",
      },
      { property: "og:title", content: "Databases & Schema — DataMind AI" },
      {
        property: "og:description",
        content: "Inspect tables, columns, primary keys, foreign keys and relationships.",
      },
    ],
  }),
  component: DatabasePage,
});

function DatabasePage() {
  const active = useActiveDatabase();
  const setDatabase = useChatStore((s) => s.setDatabase);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch {
      // API error handled silently or via toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete dataset "${tableName}"?`)) return;
    try {
      await deleteDataset(tableName);
      toast.success(`Dataset "${tableName}" deleted`);
      fetchDatasets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete dataset");
    }
  };

  // Convert API datasets to TableSchema format for SchemaExplorer
  const dynamicTables: TableSchema[] = datasets.map((ds) => ({
    name: ds.table_name,
    description: `Uploaded dataset · ${ds.row_count.toLocaleString()} rows`,
    rows: ds.row_count,
    columns: ds.columns.map((col) => ({
      name: col.name,
      type: col.type,
    })),
  }));

  // Combine static database schema with uploaded datasets
  const allTables = active.id === "events-sqlite" || active.id === "commerce-pg"
    ? [...dynamicTables, ...active.tables]
    : active.tables;

  return (
    <AppShell showContext={false}>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Databases & Datasets</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a connection to make it the active context or inspect custom uploaded datasets.
            </p>
          </motion.header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DATABASES.map((db) => (
              <DatabaseCard
                key={db.id}
                db={db}
                active={db.id === active.id}
                onSelect={() => setDatabase(db.id)}
              />
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-card/50 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Server className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium">{active.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {active.engine} · {active.host} · {allTables.length} tables
                  </p>
                </div>
              </div>
              <button
                onClick={fetchDatasets}
                disabled={loading}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs transition-all hover:bg-accent active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh schema
              </button>
            </div>
          </section>

          {/* Uploaded Datasets Section */}
          {datasets.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Table2 className="size-4 text-primary" /> Custom Uploaded Datasets ({datasets.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {datasets.map((ds) => (
                  <div
                    key={ds.table_name}
                    className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-semibold text-foreground">
                        {ds.table_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {ds.row_count.toLocaleString()} rows · {ds.column_count} columns
                      </p>
                    </div>
                    {!["customers", "orders", "products", "order_items", "payments", "reviews", "sellers", "geolocation", "category_translation"].includes(ds.table_name) && (
                      <button
                        onClick={() => handleDelete(ds.table_name)}
                        title="Delete dataset"
                        aria-label={`Delete ${ds.table_name}`}
                        className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Database className="size-4 text-[var(--color-cyan)]" /> Schema browser
            </h2>
            <SchemaExplorer tables={allTables} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
