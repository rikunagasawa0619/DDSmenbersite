import Link from "next/link";

import { cn } from "@/lib/utils";

export function PaginationNav({
  currentPage,
  totalPages,
  hrefBuilder,
}: {
  currentPage: number;
  totalPages: number;
  hrefBuilder: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="ページネーション" className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href={hrefBuilder(Math.max(currentPage - 1, 1))}
        aria-disabled={currentPage === 1}
        className={cn(
          "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition",
          currentPage === 1
            ? "pointer-events-none border-black/6 bg-black/[0.03] text-slate-400"
            : "border-black/10 bg-white text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        )}
      >
        前へ
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page) => (
          <Link
            key={page}
            href={hrefBuilder(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition",
              page === currentPage
                ? "border-[var(--color-primary)] bg-[rgba(45,91,255,0.12)] text-slate-950"
                : "border-black/8 bg-white text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
            )}
          >
            {page}
          </Link>
        ))}
      </div>
      <Link
        href={hrefBuilder(Math.min(currentPage + 1, totalPages))}
        aria-disabled={currentPage === totalPages}
        className={cn(
          "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition",
          currentPage === totalPages
            ? "pointer-events-none border-black/6 bg-black/[0.03] text-slate-400"
            : "border-black/10 bg-white text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        )}
      >
        次へ
      </Link>
    </nav>
  );
}
