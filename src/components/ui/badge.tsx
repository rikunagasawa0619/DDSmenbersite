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
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-black/5 text-slate-700",
        tone === "brand" && "bg-[color:rgba(18,56,198,0.12)] text-[var(--color-primary)]",
        tone === "accent" && "bg-[color:rgba(246,196,83,0.22)] text-[#8f6211]",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        tone === "warning" && "bg-amber-100 text-amber-700",
      )}
    >
      {children}
    </span>
  );
}
