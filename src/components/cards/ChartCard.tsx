import { useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Download, Expand, FileJson, FileSpreadsheet, X } from "lucide-react";
import type { ChartPayload } from "@/types";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="text-xs text-muted-foreground">
          <span
            className="mr-1.5 inline-block size-2 rounded-full align-middle"
            style={{ background: p.color ?? p.fill }}
          />
          {p.name}: <span className="font-medium text-foreground">{p.value?.toLocaleString?.()}</span>
        </p>
      ))}
    </div>
  );
}

function Figure({ payload }: { payload: ChartPayload }) {
  const { type, data, xKey, series } = payload;
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />;

  switch (type) {
    case "line":
      return (
        <LineChart data={data}>
          {grid}
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0, fill: s.color }}
              activeDot={{ r: 5 }}
              animationDuration={900}
            />
          ))}
        </LineChart>
      );
    case "area":
      return (
        <AreaChart data={data}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.03} />
              </linearGradient>
            ))}
          </defs>
          {grid}
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              animationDuration={900}
            />
          ))}
        </AreaChart>
      );
    case "pie":
      return (
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie
            data={data}
            dataKey={series[0].key}
            nameKey={xKey}
            innerRadius="45%"
            outerRadius="76%"
            paddingAngle={3}
            animationDuration={900}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--color-card)" />
            ))}
          </Pie>
        </PieChart>
      );
    case "scatter":
      return (
        <ScatterChart>
          {grid}
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis dataKey={series[0].key} {...axisProps} />
          <Tooltip content={<ChartTooltip />} />
          <Scatter data={data} fill={series[0].color} animationDuration={900} />
        </ScatterChart>
      );
    case "hbar":
      return (
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey={xKey} width={130} {...axisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-accent)", opacity: 0.4 }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[0, 6, 6, 0]}
              animationDuration={900}
            />
          ))}
        </BarChart>
      );
    default:
      return (
        <BarChart data={data}>
          {grid}
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-accent)", opacity: 0.4 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[6, 6, 0, 0]}
              animationDuration={900}
            />
          ))}
        </BarChart>
      );
  }
}

export function ChartCard({ payload }: { payload: ChartPayload }) {
  const [full, setFull] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const exportCsv = () => {
    const keys = [payload.xKey, ...payload.series.map((s) => s.key)];
    const csv = [
      keys.join(","),
      ...payload.data.map((row) => keys.map((k) => row[k]).join(",")),
    ].join("\n");
    downloadBlob(csv, "text/csv", "datamind-data.csv");
  };

  const exportJson = () =>
    downloadBlob(JSON.stringify(payload.data, null, 2), "application/json", "datamind-data.json");

  const exportPng = async () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const { width, height } = svg.getBoundingClientRect();
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    const source = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "datamind-chart.png";
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source)))}`;
  };

  const body = (
    <div ref={ref} className={cn("w-full", full ? "h-[70vh]" : "h-72")}>
      <ResponsiveContainer width="100%" height="100%">
        {Figure({ payload })}
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-border bg-card/60 p-4 shadow-lg shadow-black/20 transition-shadow hover:shadow-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-foreground">{payload.title}</h4>
            {payload.subtitle && (
              <p className="truncate text-xs text-muted-foreground">{payload.subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Tool label="Export PNG" onClick={exportPng}>
              <Download className="size-3.5" />
            </Tool>
            <Tool label="Export CSV" onClick={exportCsv}>
              <FileSpreadsheet className="size-3.5" />
            </Tool>
            <Tool label="Export JSON" onClick={exportJson}>
              <FileJson className="size-3.5" />
            </Tool>
            <Tool label="Fullscreen" onClick={() => setFull(true)}>
              <Expand className="size-3.5" />
            </Tool>
          </div>
        </div>
        {!full && body}
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
              <h4 className="text-base font-semibold">{payload.title}</h4>
              <button
                aria-label="Close fullscreen chart"
                onClick={() => setFull(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            {body}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

function downloadBlob(content: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
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
