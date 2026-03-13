import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, GraduationCap, Sparkles, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PortalImage } from "@/components/ui/portal-image";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth";
import { getBannerAccentStyle } from "@/lib/banner-accent";
import { getPortalHomeSnapshot } from "@/lib/portal";
import { formatDate, formatDateOnly } from "@/lib/utils";

const quickLinks = [
  { href: "/app/bookings", label: "講義予約", icon: CalendarDays },
  { href: "/app/courses", label: "教材一覧", icon: GraduationCap },
  { href: "/app/events", label: "イベント", icon: Ticket },
];

export default async function AppHomePage() {
  const user = await requireUser();
  const snapshot = await getPortalHomeSnapshot(user);
  const primaryCourse = snapshot.courses[0] ?? null;
  const nextOffering = snapshot.offerings[0] ?? null;
  const latestAnnouncement = snapshot.announcements[0] ?? null;
  const primaryActionHref = nextOffering ? "/app/bookings" : primaryCourse ? `/app/courses/${primaryCourse.slug}` : "/app/courses";
  const primaryActionLabel = nextOffering ? "予約枠を見る" : primaryCourse ? "教材を再開する" : "教材一覧へ";

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="dds-reveal overflow-hidden">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_280px]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="brand">{snapshot.plan.name}</Badge>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  次にやること
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[0.92] tracking-[-0.1em] text-slate-950">
                {nextOffering ? "次の予約を押さえる。" : "学習を再開する。"}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600">
                この画面では、今すぐ進めるべきことだけを前に出しています。迷ったら最初のアクションから進めれば十分です。
              </p>

              <div className="mt-8 rounded-[1.8rem] border border-black/8 bg-black/[0.03] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {nextOffering ? "直近の募集枠" : primaryCourse ? "続きから見る教材" : "公開中の教材"}
                </div>
                <div className="mt-4 font-display text-[2rem] font-black leading-[0.98] tracking-[-0.08em] text-slate-950">
                  {nextOffering?.title ?? primaryCourse?.title ?? "まだ教材がありません"}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {nextOffering
                    ? `${formatDate(nextOffering.startsAt)} / ${nextOffering.locationLabel}`
                    : primaryCourse?.summary ?? "公開中の教材が追加されるとここに表示されます。"}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={primaryActionHref}>
                  <Button className="gap-2">
                    {primaryActionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/app/faq">
                  <Button variant="secondary">困ったときは FAQ</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.8rem] border border-black/8 bg-black/[0.03] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">残クレジット</div>
                <div className="mt-4 font-display text-6xl font-black tracking-[-0.1em] text-[var(--color-primary)]">
                  {snapshot.plan.unlimitedCredits ? "∞" : snapshot.wallet.currentBalance}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  次回付与: {snapshot.plan.unlimitedCredits ? "常時利用可能" : formatDateOnly(snapshot.wallet.nextGrantAt)}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-black/8 bg-black/[0.03] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">最新のお知らせ</div>
                <div className="mt-4 font-display text-[1.4rem] font-black leading-[1.05] tracking-[-0.07em] text-slate-950">
                  {latestAnnouncement?.title ?? "まだお知らせはありません"}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {latestAnnouncement?.summary ?? "新しい告知がここに表示されます。"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {quickLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="dds-reveal rounded-[1.8rem] border border-black/8 bg-white/76 p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/20 hover:shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
                data-delay={String(index + 1)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">shortcut</div>
                    <div className="mt-3 font-display text-[1.55rem] font-black tracking-[-0.07em] text-slate-950">
                      {item.label}
                    </div>
                  </div>
                  <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {snapshot.banners.length === 0 ? (
          <Card className="lg:col-span-3">
            <div className="text-sm leading-7 text-slate-500">
              現在表示中のバナーはありません。管理画面から追加するとここに表示されます。
            </div>
          </Card>
        ) : (
          snapshot.banners.map((banner, index) => (
            <Card
              key={banner.id}
              className={`dds-reveal overflow-hidden ${index === 0 ? "lg:col-span-2" : ""}`}
              data-delay="1"
              style={{ backgroundImage: getBannerAccentStyle(banner.accent).backgroundImage }}
            >
              <div className={`grid gap-5 ${index === 0 ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
                {banner.imageUrl ? (
                  <PortalImage src={banner.imageUrl} alt={banner.title} className="h-52 rounded-[24px]" priority={index === 0} />
                ) : null}
                <div>
                  <Badge tone="brand">{banner.eyebrow}</Badge>
                  <h2 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">{banner.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{banner.subtitle}</p>
                  <Link href={banner.ctaHref} className="mt-6 inline-flex">
                    <Button>{banner.ctaLabel}</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="dds-reveal" data-delay="2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <GraduationCap className="h-4 w-4 text-[var(--color-primary)]" />
            学習中の教材
          </div>
          {primaryCourse ? (
            <>
              <div className="mt-4 font-display text-[2rem] font-black tracking-[-0.08em] text-slate-950">
                {primaryCourse.title}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{primaryCourse.summary}</div>
              <ProgressBar value={snapshot.courseProgress[primaryCourse.id] ?? 0} className="mt-6 bg-black/8" />
              <div className="mt-3 text-sm text-slate-600">
                {snapshot.courseProgress[primaryCourse.id] ?? 0}% 完了
              </div>
              <Link href={`/app/courses/${primaryCourse.slug}`} className="mt-6 inline-flex">
                <Button variant="secondary">続きを見る</Button>
              </Link>
            </>
          ) : (
            <div className="mt-4 rounded-[24px] border border-black/8 bg-white/72 p-5 text-sm leading-7 text-slate-700">
              まだ公開中の教材がありません。
            </div>
          )}
        </Card>

        <Card className="dds-reveal" data-delay="2">
          <div className="flex items-center justify-between gap-4 border-b border-black/6 pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Bell className="h-4 w-4 text-[var(--color-primary)]" />
              お知らせ
            </div>
            <Badge tone="neutral">{snapshot.announcements.length}件</Badge>
          </div>
          <div className="mt-5 divide-y divide-black/6">
            {snapshot.announcements.length === 0 ? (
              <div className="py-4 text-sm text-slate-500">現在公開中のお知らせはありません。</div>
            ) : (
              snapshot.announcements.slice(0, 4).map((announcement) => (
                <div key={announcement.id} className="py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {formatDateOnly(announcement.publishedAt)}
                  </div>
                  <div className="mt-2 font-display text-[1.3rem] font-black tracking-[-0.05em] text-slate-950">
                    {announcement.title}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">{announcement.summary}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section>
        <Card className="dds-reveal" data-delay="3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            受付中の募集枠
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.offerings.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 p-6 text-sm text-slate-500">
                現在受付中の募集枠はありません。
              </div>
            ) : (
              snapshot.offerings.slice(0, 3).map((offering) => (
                <div key={offering.id} className="rounded-[1.6rem] border border-black/8 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-display text-[1.15rem] font-black tracking-[-0.05em] text-slate-950">
                        {offering.title}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {formatDate(offering.startsAt)} / {offering.locationLabel}
                      </div>
                    </div>
                    <Badge tone={offering.counts.isFull ? "warning" : "success"}>
                      残{offering.counts.remaining}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">{offering.summary}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
