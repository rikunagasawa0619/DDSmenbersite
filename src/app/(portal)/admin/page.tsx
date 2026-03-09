import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminSnapshot } from "@/lib/portal";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="relative overflow-hidden bg-[#091426] text-white">
          <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-[rgba(45,91,255,0.3)] blur-3xl" />
          <div className="absolute right-0 top-0 h-full w-[38%] bg-[linear-gradient(135deg,rgba(215,255,100,0.18),transparent_55%)]" />
          <div className="relative max-w-2xl">
            <div className="dds-kicker text-[var(--color-accent)]">ダッシュボード</div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.08em] text-white md:text-5xl">
              会員運営の流れを
              <br />
              一画面で掴む。
            </h1>
          </div>
        </Card>
        <Card className="bg-[linear-gradient(180deg,#e9e2d3,#f5efe2)]">
          <div className="dds-kicker text-[var(--color-primary)]">テーマ状況</div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">現在のブランド名</div>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
                {snapshot.theme.brandName}
              </h2>
            </div>
            <Badge tone="accent">公開中</Badge>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-black/8 bg-white/58 p-4">
              <div className="dds-kicker text-slate-500">メイン</div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full border border-black/10"
                  style={{ backgroundColor: snapshot.theme.primaryColor }}
                />
                <div className="font-display text-base font-bold text-slate-950">
                  {snapshot.theme.primaryColor}
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-white/58 p-4">
              <div className="dds-kicker text-slate-500">アクセント</div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full border border-black/10"
                  style={{ backgroundColor: snapshot.theme.accentColor }}
                />
                <div className="font-display text-base font-bold text-slate-950">
                  {snapshot.theme.accentColor}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        {snapshot.stats.map((stat, index) => (
          <Card
            key={stat.label}
            className={index === 0 ? "bg-[linear-gradient(135deg,rgba(45,91,255,0.1),rgba(255,255,255,0.75))]" : ""}
          >
            <div className="dds-kicker text-slate-500">{stat.label}</div>
            <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-slate-950">
              {stat.value}
            </div>
            <div className="mt-3 text-sm text-slate-500">{stat.note}</div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="dds-kicker text-slate-500">お知らせ</div>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
                公開中の投稿
              </h2>
            </div>
            <Badge tone="brand">{snapshot.announcements.length}件</Badge>
          </div>
          <div className="mt-6 space-y-3">
            {snapshot.announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className="grid gap-3 rounded-[26px] border border-black/8 bg-white/66 p-4 md:grid-cols-[80px_minmax(0,1fr)]"
              >
                <div className="font-display text-4xl font-thin tracking-[-0.08em] text-[var(--color-primary)]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="font-semibold text-slate-950">{announcement.title}</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">{announcement.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-[#0f182b] text-white">
          <div className="dds-kicker text-[var(--color-accent)]">運営サマリー</div>
          <div className="mt-4 grid gap-4">
            <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
              <div className="text-sm text-slate-300">会員数の伸び</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em]">
                {snapshot.stats[0]?.value ?? "-"}
              </div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
              <div className="text-sm text-slate-300">公開中のお知らせ</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em]">
                {snapshot.announcements.length}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
