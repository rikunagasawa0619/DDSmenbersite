import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <BrandMark />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            トップに戻る
          </Link>
        </header>
        <main className="mt-10">{children}</main>
      </div>
    </div>
  );
}
