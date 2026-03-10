import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "accent" | "success" | "warning";
};

const badgeStyles: Record<Required<BadgeProps>["tone"], CSSProperties> = {
  neutral: {
    borderColor: "var(--color-outline)",
    background: "color-mix(in srgb, var(--color-surface-inset) 88%, transparent)",
    color: "var(--color-muted-strong)",
  },
  brand: {
    borderColor: "color-mix(in srgb, var(--color-primary) 28%, transparent)",
    background: "color-mix(in srgb, var(--color-primary) 14%, var(--color-surface-raised))",
    color: "var(--color-primary)",
  },
  accent: {
    borderColor: "color-mix(in srgb, var(--color-accent) 40%, var(--color-outline-strong))",
    background: "color-mix(in srgb, var(--color-accent) 22%, var(--color-surface-raised))",
    color: "var(--color-foreground)",
  },
  success: {
    borderColor: "color-mix(in srgb, var(--color-success) 34%, var(--color-outline-strong))",
    background: "color-mix(in srgb, var(--color-success) 16%, var(--color-surface-raised))",
    color: "color-mix(in srgb, var(--color-success) 78%, var(--color-foreground))",
  },
  warning: {
    borderColor: "color-mix(in srgb, var(--color-warning) 34%, var(--color-outline-strong))",
    background: "color-mix(in srgb, var(--color-warning) 18%, var(--color-surface-raised))",
    color: "color-mix(in srgb, var(--color-warning) 72%, var(--color-foreground))",
  },
};

export function Badge({
  children,
  tone = "neutral",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.18em]",
      )}
      style={badgeStyles[tone]}
    >
      {children}
    </span>
  );
}
