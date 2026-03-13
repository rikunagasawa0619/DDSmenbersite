import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, GraduationCap, Ticket, TrendingUp, Zap } from "lucide-react";

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
  { href: "/app/faq", label: "FAQ", icon: Bell },
];

export default async function AppHomePage() {
  const user = await requireUser();
  const snapshot = await getPortalHomeSnapshot(user);
  const primaryCourse = snapshot.courses[0];
  const nextOffering = snapshot.offerings[0];
  const latestAnnouncement = snapshot.announcements[0];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="dds-reveal dds-tile relative overflow-hidden bg-[linear-gradient(145deg,#141b30,#1d2a48_42%,#f6efe1_42%,#fffdf8)] text-slate-950">
          <div className="absolute right-[-20px] top-[-20px] h-44 w-44 rounded-full bg-[rgba(45,91,255,0.2)] blur-3xl" />
          <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="pt-1">
              <Badge tone="brand">{snapshot.plan.name}</Badge>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.09em] text-white md:text-5xl xl:text-slate-950">
                今日の学習と予約を、
                <br />
                最短距離で進める。
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 xl:text-slate-600">
                残クレジット、直近の募集枠、今見るべき教材、お知らせをまとめています。迷わず次の行動に進めるホームです。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/app/bookings">
                  <Button>予約を確認</Button>
                </Link>
                <Link href="/app/courses">
                  <Button variant="secondary">教材を見る</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[28px] border border-black/8 bg-white/86 p-5 shadow-[0_24px_56px_rgba(15,23,42,0.08)]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">予約残高</div>
                <div className="mt-3 font-display text-5xl font-extrabold tracking-[-0.08em] text-[var(--color-primary)]">
                  {snapshot.plan.unlimitedCredits ? "∞" : snapshot.wallet.currentBalance}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  次回付与: {snapshot.plan.unlimitedCredits ? "常時利用可能" : formatDateOnly(snapshot.wallet.nextGrantAt)}
                </div>
              </div>
              <div className="rounded-[28px] border border-black/8 bg-[#10182b] p-5 text-white shadow-[0_24px_56px_rgba(7,17,31,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">次の予定</div>
                <div className="mt-3 font-semibold">{nextOffering ? nextOffering.title : "現在受付中の募集枠はありません"}</div>
                <div className="mt-2 text-sm text-white/70">
                  {nextOffering ? formatDate(nextOffering.startsAt) : "新しい募集枠が公開されるとここに表示されます。"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="dds-reveal grid gap-4 bg-[linear-gradient(180deg,#eef3ff,#f6efe2)]" data-delay="1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Zap className="h-4 w-4 text-[var(--color-primary)]" />
            今日のショートカット
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[24px] border border-black/8 bg-white/78 p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/24 hover:shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
                >
                  <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                  <div className="mt-4 font-display text-xl font-extrabold tracking-[-0.06em] text-slate-950">
                    {item.label}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition group-hover:text-[var(--color-primary)]">
                    開く
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/74 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">最新のお知らせ</div>
            <div className="mt-3 font-semibold text-slate-950">{latestAnnouncement?.title ?? "まだお知らせはありません"}</div>
            <div className="mt-2 text-sm leading-7 text-slate-600">{latestAnnouncement?.summary ?? "新しい告知がここに表示されます。"}</div>
          </div>
        </Card>
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

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="dds-reveal" data-delay="2" style={{ background: "var(--color-panel-highlight)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <TrendingUp className="h-4 w-4 text-[var(--color-primary)]" />
            学習進捗
          </div>
          {primaryCourse ? (
            <>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">{primaryCourse.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{primaryCourse.summary}</p>
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
              まだ公開中の教材がありません。運営がコースを追加すると、ここに学習進捗が表示されます。
            </div>
          )}
        </Card>

        <Card className="dds-reveal" data-delay="2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CalendarDays className="h-4 w-4 text-[var(--color-primary)]" />
              直近のイベントと予約
            </div>
            <Link href="/app/bookings" className="text-sm font-semibold text-[var(--color-primary)]">
              予約一覧へ
            </Link>
          </div>
          <div className="mt-5 grid gap-4">
            {snapshot.offerings.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 p-6 text-sm text-slate-500">
                現在受付中の募集枠はありません。
              </div>
            ) : (
              snapshot.offerings.slice(0, 3).map((offering) => (
                <div key={offering.id} className="rounded-[24px] border border-black/6 bg-black/[0.02] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-950">{offering.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{formatDate(offering.startsAt)} / {offering.locationLabel}</div>
                    </div>
                    <Badge tone={offering.counts.isFull ? "warning" : "success"}>
                      残{offering.counts.remaining}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{offering.summary}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="dds-reveal" data-delay="3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Ticket className="h-4 w-4 text-[var(--color-primary)]" />
            自分の予約状況
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.reservations.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 p-6 text-sm text-slate-500">
                現在の予約はありません。
              </div>
            ) : (
              snapshot.reservations.map((reservation) => {
                const offering = snapshot.offerings.find((item) => item.id === reservation.offeringId);
                if (!offering) return null;
                return (
                  <div key={reservation.id} className="rounded-[24px] border border-black/6 p-4">
                    <div className="font-semibold text-slate-950">{offering.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{formatDate(offering.startsAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="dds-reveal" data-delay="3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Bell className="h-4 w-4 text-[var(--color-primary)]" />
            お知らせ
          </div>
          <div className="mt-5 divide-y divide-black/6">
            {snapshot.announcements.length === 0 ? (
              <div className="py-4 text-sm text-slate-500">現在公開中のお知らせはありません。</div>
            ) : (
              snapshot.announcements.slice(0, 4).map((announcement) => (
                <div key={announcement.id} className="py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {formatDateOnly(announcement.publishedAt)}
                  </div>
                  <div className="mt-2 font-semibold text-slate-950">{announcement.title}</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">{announcement.summary}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
