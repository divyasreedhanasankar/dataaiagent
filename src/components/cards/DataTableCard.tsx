import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Table2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from "lucide-react";
import type { TablePayload } from "@/types";

const toneFor = (value: string) => {
  const v = value.toLowerCase();
  if (v.includes("out of stock") || v.includes("critical") || v.includes("error") || v.includes("cancelled"))
    return "bg-destructive/15 text-destructive";
  if (v.includes("low") || v.includes("warning") || v.includes("pending"))
    return "bg-[var(--color-warning)]/15 text-[var(--color-warning)]";
  return "bg-[var(--color-success)]/15 text-[var(--color-success)]";
};

const PAGE_SIZE = 10;

export function DataTableCard({ payload }: { payload: TablePayload }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const statusIdx = payload.columns.findIndex((c) => /status/i.test(c));

  const filteredAndSortedRows = useMemo(() => {
    let result = payload.rows;

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(q))
      );
    }

    if (sortCol !== null) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortCol];
        const bVal = b[sortCol];

        if (aVal === bVal) return 0;
        
        const aEmpty = aVal === null || aVal === undefined || aVal === "";
        const bEmpty = bVal === null || bVal === undefined || bVal === "";
        
        if (aEmpty && !bEmpty) return sortDir === "asc" ? 1 : -1;
        if (!aEmpty && bEmpty) return sortDir === "asc" ? -1 : 1;
        if (aEmpty && bEmpty) return 0;

        const aNum = Number(aVal);
        const bNum = Number(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDir === "asc" 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [payload.rows, search, sortCol, sortDir]);

  const totalRows = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  
  // Adjust page if it exceeds totalPages due to filtering
  if (page > totalPages && totalPages > 0) {
    setPage(totalPages);
  }

  const startIndex = (page - 1) * PAGE_SIZE;
  const pageRows = filteredAndSortedRows.slice(startIndex, startIndex + PAGE_SIZE);

  const handleSort = (idx: number) => {
    if (sortCol === idx) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortCol(null);
        setSortDir("asc");
      }
    } else {
      setSortCol(idx);
      setSortDir("asc");
    }
    setPage(1);
  };

  const downloadCsv = () => {
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const headers = payload.columns.map(escapeCsv).join(",");
    const rows = filteredAndSortedRows.map(row => row.map(escapeCsv).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "datamind-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-lg shadow-black/20"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap">
          <Table2 className="size-3.5 text-[var(--color-cyan)]" /> 
          Query result · {payload.rows.length.toLocaleString()} {payload.rows.length === 1 ? "row" : "rows"}
        </span>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in results..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 w-40 rounded-md border border-border bg-background/50 pl-8 pr-3 text-xs outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 sm:w-56"
            />
          </div>
          
          <button
            onClick={downloadCsv}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Download CSV"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {payload.columns.map((c, i) => (
                <th 
                  key={c} 
                  className="whitespace-nowrap px-4 py-2.5 font-medium uppercase tracking-wider text-[11px] cursor-pointer hover:bg-accent/30 select-none group"
                  onClick={() => handleSort(i)}
                >
                  <div className="flex items-center gap-1.5">
                    {c.replace(/_/g, " ")}
                    <span className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                      {sortCol === i ? (
                        sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 transition-colors last:border-0 hover:bg-accent/40">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-4 py-2.5 text-foreground/90 font-mono text-[11.5px]">
                    {j === statusIdx ? (
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium font-sans ${toneFor(String(cell))}`}>
                        {cell}
                      </span>
                    ) : cell === "" || cell === null || cell === undefined ? (
                      <span className="text-muted-foreground/50 italic">null</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={payload.columns.length} className="px-4 py-8 text-center text-muted-foreground italic">
                  No matching results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalRows)} of {totalRows.toLocaleString()} rows
            {search && ` (filtered from ${payload.rows.length})`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="grid size-7 place-items-center rounded-lg border border-border bg-background/50 text-foreground transition-all hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2 text-[11px] font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
              className="grid size-7 place-items-center rounded-lg border border-border bg-background/50 text-foreground transition-all hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
