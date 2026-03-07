import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, Ticket, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth";
import { getPortalSnapshot } from "@/lib/portal";
import { formatDate, formatDateOnly } from "@/lib/utils";

export default async function AppHomePage() {
  const user = await requireUser();
  const snapshot = await getPortalSnapshot(user);
  const primaryCourse = snapshot.courses[0];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,#ffffff,#d7e1ff)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge tone="brand">{snapshot.plan.name}</Badge>
              <h1 className="mt-4 font-display text-4xl font-bold text-slate-950">
                {snapshot.theme.heroHeadline}
              </h1>
              <p className="mt-4 text-slate-600">
                今日は {snapshot.wallet.currentBalance === 999 ? "無制限" : `${snapshot.wallet.currentBalance}回`}
                の予約余力があります。教材、予約、イベント、お知らせをここから辿れます。
              </p>
            </div>
            <div className="grid gap-3 rounded-[28px] bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="text-sm font-semibold text-slate-500">Credit summary</div>
              <div className="font-display text-5xl font-bold text-[var(--color-primary)]">
                {snapshot.plan.unlimitedCredits ? "∞" : snapshot.wallet.currentBalance}
              </div>
              <div className="text-sm text-slate-600">
                次回付与:{" "}
                {snapshot.plan.unlimitedCredits
                  ? "常時利用可能"
                  : formatDateOnly(snapshot.wallet.nextGrantAt)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#111b2f] text-white">
          <div className="flex items-center gap-2 text-sm text-white/65">
            <TrendingUp className="h-4 w-4" />
            Progress
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">{primaryCourse.title}</h2>
          <p className="mt-3 text-white/74">{primaryCourse.summary}</p>
          <ProgressBar
            value={snapshot.courseProgress[primaryCourse.id] ?? 0}
            className="mt-6 bg-white/10"
          />
          <div className="mt-3 text-sm text-white/72">
            {snapshot.courseProgress[primaryCourse.id] ?? 0}% 完了
          </div>
          <Link href={`/app/courses/${primaryCourse.slug}`} className="mt-6 inline-flex">
            <Button className="bg-white text-[#111b2f] hover:bg-white/90">続きを見る</Button>
          </Link>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {snapshot.banners.map((banner) => (
          <Card
            key={banner.id}
            className={`overflow-hidden bg-gradient-to-br ${banner.accent}`}
          >
            <Badge tone="brand">{banner.eyebrow}</Badge>
            <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{banner.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{banner.subtitle}</p>
            <Link href={banner.ctaHref} className="mt-6 inline-flex">
              <Button>{banner.ctaLabel}</Button>
            </Link>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Bell className="h-4 w-4" />
              お知らせ
            </div>
            <Link href="/app/events" className="text-sm font-semibold text-[var(--color-primary)]">
              イベント一覧
            </Link>
          </div>
          <div className="mt-5 divide-y divide-black/6">
            {snapshot.announcements.map((announcement) => (
              <div key={announcement.id} className="py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {formatDateOnly(announcement.publishedAt)}
                </div>
                <div className="mt-2 font-semibold text-slate-950">{announcement.title}</div>
                <div className="mt-2 text-sm leading-7 text-slate-600">{announcement.summary}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CalendarDays className="h-4 w-4" />
            直近のイベントと予約
          </div>
          <div className="mt-5 space-y-4">
            {snapshot.offerings.slice(0, 3).map((offering) => (
              <div key={offering.id} className="rounded-[24px] border border-black/6 bg-black/[0.02] p-4">
                <div className="flex items-center justify-between gap-4">
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
            ))}
          </div>
          <Link href="/app/bookings" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            予約画面へ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Ticket className="h-4 w-4" />
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

        <Card>
          <div className="text-sm font-semibold text-slate-500">利用規約メモ</div>
          <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">クレジット運用ポリシー</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <li>Hobby / Biz は月4回付与、未使用分は上限まで繰越。</li>
            <li>Pro は全講義・全予約に無制限でアクセス可能。</li>
            <li>返却期限内キャンセルのみクレジット返却対象。</li>
            <li>{snapshot.theme.termsNotice}</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
