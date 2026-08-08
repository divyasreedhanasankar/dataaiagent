import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center rounded-xl bg-gradient-to-br from-primary via-[var(--color-violet)] to-[var(--color-cyan)] shadow-lg shadow-primary/25",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[58%] text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
        <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
        <path d="M9 9.5 12 12l3-2.5" />
      </svg>
    </span>
  );
}
