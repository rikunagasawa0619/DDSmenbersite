import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  href = "/",
  className,
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-primary)] text-xl font-black text-white">
        <span className="relative z-10">D</span>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.38),transparent_48%)]" />
      </div>
      <div>
        <div className="font-display text-lg font-bold tracking-[0.18em] text-[var(--color-primary)]">
          {compact ? "DDS" : "DDS MEMBERS"}
        </div>
        {!compact ? (
          <div className="text-xs text-slate-500">Member OS for AI school operations</div>
        ) : null}
      </div>
    </Link>
  );
}
