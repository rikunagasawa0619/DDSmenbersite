import Link from "next/link";

import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

const exportsList = [
  {
    href: "/api/admin/exports/members",
    title: "会員一覧 CSV",
    description: "会員基本情報、プラン、ステータス、セグメント、契約開始日を出力します。",
  },
  {
    href: "/api/admin/exports/reservations",
    title: "予約一覧 CSV",
    description: "募集枠タイトル、会員メール、予約ステータス、申込日時を出力します。",
  },
  {
    href: "/api/admin/exports/credits",
    title: "クレジット台帳 CSV",
    description: "クレジット付与、消費、返却、補正の履歴を出力します。",
  },
];

export default async function AdminExportsPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          CSV Export
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">データエクスポート</h1>
      </div>

      <div className="grid gap-5">
        {exportsList.map((item) => (
          <Card key={item.href}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-950">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
              <Link
                href={item.href}
                className="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
              >
                CSV をダウンロード
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
