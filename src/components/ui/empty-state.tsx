import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(241,234,220,0.92))]">
      <div className="relative rounded-[28px] border border-dashed border-black/10 bg-white/55 p-8 text-center">
        <div className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full bg-[rgba(45,91,255,0.12)] blur-2xl" />
        <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-[24px] border border-[var(--color-outline)] bg-[var(--color-surface-strong)] text-[var(--color-primary)]">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="relative mt-5 font-display text-2xl font-extrabold tracking-[-0.06em] text-slate-950">
          {title}
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
          {description}
        </p>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="relative mt-6 inline-flex">
            <Button>{actionLabel}</Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
