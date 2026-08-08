import { Download, FileJson, FileSpreadsheet, FileCode } from "lucide-react";
import { exportCSV, exportJSON, exportSQL } from "@/lib/export-utils";
import { toast } from "sonner";
import type { TablePayload, SqlPayload } from "@/types";

interface ExportButtonsProps {
  table?: TablePayload;
  sql?: SqlPayload;
}

export function ExportButtons({ table, sql }: ExportButtonsProps) {
  if (!table && !sql) return null;

  const handleCSV = () => {
    if (!table) return;
    exportCSV(table.columns, table.rows);
    toast.success("CSV exported successfully");
  };

  const handleJSON = () => {
    if (!table) return;
    exportJSON(table.columns, table.rows);
    toast.success("JSON exported successfully");
  };

  const handleSQL = () => {
    if (!sql) return;
    exportSQL(sql.sql);
    toast.success("SQL exported successfully");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      {table && (
        <>
          <ExportBtn label="Export CSV" onClick={handleCSV}>
            <FileSpreadsheet className="size-3" />
            <span>CSV</span>
          </ExportBtn>
          <ExportBtn label="Export JSON" onClick={handleJSON}>
            <FileJson className="size-3" />
            <span>JSON</span>
          </ExportBtn>
        </>
      )}
      {sql && (
        <ExportBtn label="Export SQL" onClick={handleSQL}>
          <FileCode className="size-3" />
          <span>SQL</span>
        </ExportBtn>
      )}
    </div>
  );
}

function ExportBtn({
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
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}
