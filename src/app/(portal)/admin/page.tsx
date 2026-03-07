import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminSnapshot } from "@/lib/portal";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
          ダッシュボード
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">運営ダッシュボード</h1>
      </div>

      <section className="grid gap-5 xl:grid-cols-4">
        {snapshot.stats.map((stat) => (
          <Card key={stat.label} className="bg-white">
            <div className="text-sm font-semibold text-slate-500">{stat.label}</div>
            <div className="mt-3 font-display text-4xl font-bold text-slate-950">{stat.value}</div>
            <div className="mt-2 text-sm text-slate-500">{stat.note}</div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-500">最新のお知らせ</div>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">公開中のお知らせ</h2>
            </div>
            <Badge tone="brand">{snapshot.announcements.length}件</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-[24px] border border-black/6 p-4">
                <div className="font-semibold text-slate-950">{announcement.title}</div>
                <div className="mt-2 text-sm text-slate-600">{announcement.summary}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-[#111b2f] text-white">
          <div className="text-sm font-semibold text-white/65">テーマ設定</div>
          <h2 className="mt-3 font-display text-3xl font-bold">{snapshot.theme.brandName}</h2>
          <div className="mt-6 grid gap-3">
            <div className="rounded-[22px] bg-white/8 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">メインカラー</div>
              <div className="mt-2 text-lg font-bold">{snapshot.theme.primaryColor}</div>
            </div>
            <div className="rounded-[22px] bg-white/8 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">アクセント</div>
              <div className="mt-2 text-lg font-bold">{snapshot.theme.accentColor}</div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
