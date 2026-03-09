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
      <div className="relative flex h-13 w-13 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[#091426] text-xl font-black text-white shadow-[12px_12px_0_rgba(45,91,255,0.24)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--color-accent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(45,91,255,0.38),transparent_60%)]" />
        <span className="relative z-10 font-display text-[1.1rem] font-extrabold tracking-[-0.08em]">DDS</span>
      </div>
      <div>
        <div className="font-display text-lg font-extrabold tracking-[0.16em] text-[var(--color-primary)]">
          {compact ? "DDS" : "DDS MEMBERS"}
        </div>
        {!compact ? (
          <div className="dds-kicker mt-1 text-[var(--color-ink-soft)]/55">Member OS / Learning Stack</div>
        ) : null}
      </div>
    </Link>
  );
}
