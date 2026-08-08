import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-7 text-foreground/92">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-5 mb-2 text-xl font-semibold" {...p} />,
          h2: (p) => <h2 className="mt-5 mb-2 text-lg font-semibold" {...p} />,
          h3: (p) => <h3 className="mt-4 mb-2 text-base font-semibold" {...p} />,
          p: (p) => <p className="mb-3 last:mb-0" {...p} />,
          ul: (p) => <ul className="mb-3 list-disc space-y-1 pl-5 marker:text-muted-foreground" {...p} />,
          ol: (p) => <ol className="mb-3 list-decimal space-y-1 pl-5 marker:text-muted-foreground" {...p} />,
          strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
          a: (p) => <a className="text-primary underline underline-offset-2 hover:opacity-80" {...p} />,
          blockquote: (p) => (
            <blockquote className="mb-3 border-l-2 border-primary/50 pl-3 text-muted-foreground" {...p} />
          ),
          table: (p) => (
            <div className="mb-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs" {...p} />
            </div>
          ),
          thead: (p) => <thead className="bg-secondary/50 text-muted-foreground" {...p} />,
          th: (p) => <th className="whitespace-nowrap px-3 py-2 font-medium" {...p} />,
          td: (p) => <td className="whitespace-nowrap border-t border-border/60 px-3 py-2" {...p} />,
          code: ({ className, children, ...props }) => {
            const isBlock = String(className ?? "").includes("language-");
            if (!isBlock)
              return (
                <code
                  className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-[var(--color-cyan)]"
                  {...props}
                >
                  {children}
                </code>
              );
            return <CodeBlock>{String(children)}</CodeBlock>;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative mb-3 overflow-hidden rounded-xl border border-border bg-background/60">
      <button
        aria-label="Copy code"
        onClick={async () => {
          await navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-md bg-card/80 text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5 text-[var(--color-success)]" /> : <Copy className="size-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-foreground/90">
        <code>{children.replace(/\n$/, "")}</code>
      </pre>
    </div>
  );
}
