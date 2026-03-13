import { CalendarDays, Mail, Sparkles } from "lucide-react";

import { LiveActivityFeed } from "@/components/admin/live-activity-feed";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminSnapshot } from "@/lib/portal";
import { listAuditLogs } from "@/lib/repository";
import { formatDate, formatDateOnly } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [snapshot, initialLogs] = await Promise.all([getAdminSnapshot(), listAuditLogs(6)]);

  const primaryStat = snapshot.stats[0];
  const secondaryStats = snapshot.stats.slice(1, 4);
  const nextOffering = snapshot.offerings[0] ?? null;
  const nextCampaign = snapshot.campaigns.find((campaign) => campaign.status !== "sent") ?? null;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="dds-reveal overflow-hidden">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_280px]">
            <div>
              <div className="dds-kicker text-[var(--color-primary)]">operations</div>
              <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.8rem,5vw,5rem)] font-black leading-[0.92] tracking-[-0.1em] text-slate-950">
                今日の運営判断を
                <br />
                最短で確認する。
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600">
                最初に確認すべき数字、次の配信、直近の募集枠だけを前に出しています。装飾よりも、判断が速いことを優先した構成です。
              </p>
            </div>

            <div className="rounded-[1.8rem] border border-black/8 bg-black/[0.03] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {primaryStat?.label ?? "主要指標"}
              </div>
              <div className="mt-4 font-display text-6xl font-black tracking-[-0.1em] text-[var(--color-primary)]">
                {primaryStat?.value ?? "-"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{primaryStat?.note ?? "主要な指標がここに表示されます。"}</div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="dds-reveal" data-delay="1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <CalendarDays className="h-4 w-4 text-[var(--color-primary)]" />
              直近の募集枠
            </div>
            <div className="mt-4 font-display text-[1.8rem] font-black leading-[1] tracking-[-0.08em] text-slate-950">
              {nextOffering?.title ?? "予定なし"}
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              {nextOffering ? `${formatDate(nextOffering.startsAt)} / ${nextOffering.locationLabel}` : "公開中の募集枠がありません。"}
            </div>
          </Card>

          <Card className="dds-reveal" data-delay="2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Mail className="h-4 w-4 text-[var(--color-primary)]" />
              次の配信
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="font-display text-[1.4rem] font-black leading-[1.05] tracking-[-0.07em] text-slate-950">
                {nextCampaign?.title ?? "送信予定なし"}
              </div>
              {nextCampaign ? (
                <Badge tone={nextCampaign.status === "scheduled" ? "warning" : "neutral"}>
                  {nextCampaign.status === "scheduled" ? "予約済み" : "下書き"}
                </Badge>
              ) : null}
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              {nextCampaign?.scheduledAt ? formatDate(nextCampaign.scheduledAt) : "次の配信はまだ作成されていません。"}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {secondaryStats.map((stat, index) => (
          <Card key={stat.label} className="dds-reveal" data-delay={String(index + 1)}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{stat.label}</div>
            <div className="mt-4 font-display text-4xl font-black tracking-[-0.08em] text-slate-950">
              {stat.value}
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-600">{stat.note}</div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="dds-reveal" data-delay="1">
          <div className="flex items-end justify-between gap-4 border-b border-black/6 pb-5">
            <div>
              <div className="dds-kicker text-[var(--color-primary)]">announcements</div>
              <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.08em] text-slate-950">
                最新のお知らせ
              </h2>
            </div>
            <Badge tone="neutral">{snapshot.announcements.length}件</Badge>
          </div>
          <div className="mt-5 divide-y divide-black/6">
            {snapshot.announcements.slice(0, 5).map((announcement) => (
              <div key={announcement.id} className="py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {formatDateOnly(announcement.publishedAt)}
                </div>
                <div className="mt-2 font-display text-[1.3rem] font-black tracking-[-0.05em] text-slate-950">
                  {announcement.title}
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">{announcement.summary}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="dds-reveal" data-delay="2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            ブランド設定
          </div>
          <div className="mt-4 font-display text-[2rem] font-black tracking-[-0.08em] text-slate-950">
            {snapshot.theme.brandName}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-black/8 bg-black/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">操作色</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-black/10" style={{ backgroundColor: snapshot.theme.primaryColor }} />
                <div className="font-display text-base font-black tracking-[-0.05em] text-slate-950">
                  {snapshot.theme.primaryColor}
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-black/8 bg-black/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">補助色</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-black/10" style={{ backgroundColor: snapshot.theme.accentColor }} />
                <div className="font-display text-base font-black tracking-[-0.05em] text-slate-950">
                  {snapshot.theme.accentColor}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <LiveActivityFeed initialLogs={initialLogs} />
    </div>
  );
}
