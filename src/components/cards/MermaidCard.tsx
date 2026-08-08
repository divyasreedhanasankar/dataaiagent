import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Download, Expand, Minus, Plus, X, Workflow } from "lucide-react";

export function MermaidCard({ title, code }: { title: string; code: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
          fontFamily: "Inter, sans-serif",
          themeVariables: {
            background: "transparent",
            primaryColor: "#1f2937",
            primaryTextColor: "#e5e7eb",
            primaryBorderColor: "#3b82f6",
            lineColor: "#7c8595",
            secondaryColor: "#312e81",
            tertiaryColor: "#164e63",
          },
        });
        const { svg: rendered } = await mermaid.render(`mmd-${id}`, code);
        if (mounted.current) setSvg(rendered);
      } catch {
        if (mounted.current) setError(true);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [code, id]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadSvg = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "datamind-diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const canvas = (scale: number, height: string) => (
    <div className={`overflow-auto rounded-xl bg-background/40 p-4 ${height}`}>
      {error ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Diagram could not be rendered.
        </p>
      ) : svg ? (
        <div
          className="mx-auto w-fit origin-top transition-transform duration-200 [&_svg]:max-w-none"
          style={{ transform: `scale(${scale})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="grid h-40 place-items-center">
          <div className="h-full w-full animate-pulse rounded-lg bg-muted/40" />
        </div>
      )}
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card/60 p-4 shadow-lg shadow-black/20"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[var(--color-violet)]/15 text-[var(--color-violet)]">
              <Workflow className="size-3.5" />
            </span>
            <h4 className="truncate text-sm font-semibold">{title}</h4>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Tool label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}>
              <Minus className="size-3.5" />
            </Tool>
            <Tool label="Zoom in" onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}>
              <Plus className="size-3.5" />
            </Tool>
            <Tool label="Copy Mermaid source" onClick={copy}>
              {copied ? <Check className="size-3.5 text-[var(--color-success)]" /> : <Copy className="size-3.5" />}
            </Tool>
            <Tool label="Download SVG" onClick={downloadSvg}>
              <Download className="size-3.5" />
            </Tool>
            <Tool label="Fullscreen diagram" onClick={() => setFull(true)}>
              <Expand className="size-3.5" />
            </Tool>
          </div>
        </div>
        {canvas(zoom, "max-h-[420px]")}
      </motion.div>

      {full && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-6xl rounded-3xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold">{title}</h4>
              <button
                aria-label="Close fullscreen diagram"
                onClick={() => setFull(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            {canvas(zoom, "h-[72vh]")}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

function Tool({
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
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
