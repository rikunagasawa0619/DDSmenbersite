import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "accent" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.18em]",
        tone === "neutral" && "border-black/8 bg-black/4 text-slate-700",
        tone === "brand" && "border-[rgba(45,91,255,0.18)] bg-[rgba(45,91,255,0.12)] text-[var(--color-primary)]",
        tone === "accent" && "border-[rgba(215,255,100,0.42)] bg-[rgba(215,255,100,0.38)] text-[#304200]",
        tone === "success" && "border-emerald-200 bg-emerald-100 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-100 text-amber-700",
      )}
    >
      {children}
    </span>
  );
}
