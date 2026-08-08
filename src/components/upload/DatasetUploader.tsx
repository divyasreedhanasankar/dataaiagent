import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  Loader2,
  Table2,
  AlertCircle,
} from "lucide-react";
import { uploadDataset, type UploadResponse } from "@/services/api";
import { toast } from "sonner";

interface DatasetUploaderProps {
  onClose: () => void;
}

export function DatasetUploader({ onClose }: DatasetUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

  const validateFile = (file: File): boolean => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        `Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50 MB.");
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setError(null);
    setIsUploading(true);
    setResult(null);

    try {
      const response = await uploadDataset(file);
      setResult(response);
      toast.success(
        `Dataset "${response.table_name}" imported successfully!`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(message);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Upload className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Upload Dataset
              </h3>
              <p className="text-[11px] text-muted-foreground">
                CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close uploader"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Upload zone */}
        {!result && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-accent/20"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Uploading and importing...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
                  <FileSpreadsheet className="size-6" />
                </span>
                <div>
                  <p className="text-sm text-foreground">
                    Drag & drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground">or</p>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                >
                  Choose File
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Max 50 MB · CSV, XLSX, XLS
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/8 p-3.5"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success / Preview */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-4"
            >
              {/* Success badge */}
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/8 p-3">
                <Check className="size-4 text-[var(--color-success)]" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Dataset imported as{" "}
                    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-primary">
                      {result.table_name}
                    </code>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {result.row_count.toLocaleString()} rows ·{" "}
                    {result.column_count} columns
                  </p>
                </div>
              </div>

              {/* Preview table */}
              {result.preview && result.preview.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-2">
                    <Table2 className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Preview (first {result.preview.length} rows)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          {result.columns.map((col) => (
                            <th
                              key={col}
                              className="whitespace-nowrap px-3 py-2 font-medium"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.preview.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 last:border-0"
                          >
                            {result.columns.map((col) => (
                              <td
                                key={col}
                                className="whitespace-nowrap px-3 py-2 text-foreground/80"
                              >
                                {String(row[col] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info text */}
              <p className="text-center text-[11px] text-muted-foreground">
                You can now ask questions about this dataset using natural language.
              </p>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Start Analyzing
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
