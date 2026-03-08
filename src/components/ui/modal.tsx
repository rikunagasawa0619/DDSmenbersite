import Link from "next/link";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function Modal({
  title,
  description,
  closeHref,
  size = "lg",
  children,
}: {
  title: string;
  description?: string;
  closeHref: string;
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/48 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "relative max-h-[90vh] w-full overflow-hidden rounded-[32px] border border-black/8 bg-[#f8f6f1] shadow-[0_40px_120px_rgba(15,23,42,0.22)]",
          size === "md" && "max-w-3xl",
          size === "lg" && "max-w-5xl",
          size === "xl" && "max-w-6xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/6 px-6 py-5 md:px-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
            ) : null}
          </div>
          <Link
            href={closeHref}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div className="max-h-[calc(90vh-104px)] overflow-y-auto px-6 py-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
