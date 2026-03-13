import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Ticket, Zap } from "lucide-react";

import { bookOfferingAction, cancelReservationAction } from "@/actions/member";
import { BookingsCalendarPanel } from "@/components/member/bookings-calendar-panel";
import { getCalendarMonth, shiftCalendarMonth } from "@/components/ui/schedule-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PortalImage } from "@/components/ui/portal-image";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getPortalBookingsSnapshot } from "@/lib/portal";
import { formatDate, formatDateOnly } from "@/lib/utils";

export default async function BookingsPage() {
  const user = await requireUser();
  const snapshot = await getPortalBookingsSnapshot(user);
  const reservationMap = new Map(
    snapshot.reservations.map((reservation) => [reservation.offeringId, reservation]),
  );
  const initialMonth = shiftCalendarMonth(getCalendarMonth(), 0);

  const calendarEntries = snapshot.offerings.map((offering) => ({
    id: offering.id,
    title: offering.title,
    startsAt: offering.startsAt,
    href: `#offering-${offering.id}`,
    badge: offering.offeringType === "booking" ? "講義予約" : "イベント",
  }));

  const nextOffering = snapshot.offerings[0];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="dds-reveal dds-tile relative overflow-hidden bg-[linear-gradient(140deg,#10182b,#173056_52%,#254cff)] text-white">
          <div className="absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_center,rgba(215,255,100,0.26),transparent_62%)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge tone="accent">{snapshot.plan.name}</Badge>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.08em] md:text-5xl">
                予約の判断を、
                <br />
                ひと目で終わらせる。
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/78">
                クレジット残高、次回付与日、直近の予定、申込状態を一画面に集約しています。今すぐ押せる予約だけを迷わず選べる構成にしています。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/app/events">
                  <Button className="bg-white text-[#142448] hover:bg-white/92">イベントを見る</Button>
                </Link>
                <Link href="/app/courses">
                  <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/14 hover:text-white">
                    教材へ戻る
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-[360px] gap-3">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">予約残高</div>
                <div className="mt-3 font-display text-5xl font-extrabold tracking-[-0.08em]">
                  {snapshot.plan.unlimitedCredits ? "∞" : snapshot.wallet.currentBalance}
                </div>
                <div className="mt-2 text-sm text-white/72">
                  次回付与: {snapshot.plan.unlimitedCredits ? "常時利用可能" : formatDateOnly(snapshot.wallet.nextGrantAt)}
                </div>
              </div>
              <div className="rounded-[28px] border border-white/12 bg-black/18 p-5 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">直近の予定</div>
                <div className="mt-3 font-semibold text-white">
                  {nextOffering ? nextOffering.title : "現在公開中の募集枠はありません"}
                </div>
                <div className="mt-2 text-sm text-white/72">
                  {nextOffering ? formatDate(nextOffering.startsAt) : "新しい募集枠が公開されると表示されます。"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="dds-reveal grid gap-4 bg-[linear-gradient(180deg,#eef3ff,#f6efe2)] text-slate-950" data-delay="1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Zap className="h-4 w-4 text-[var(--color-primary)]" />
            予約状況サマリー
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-black/8 bg-white/74 p-4">
              <div className="text-xs tracking-[0.16em] text-slate-500">今月付与</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
                {snapshot.wallet.thisCycleGranted}
              </div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-white/74 p-4">
              <div className="text-xs tracking-[0.16em] text-slate-500">今月消費</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
                {snapshot.wallet.thisCycleConsumed}
              </div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-white/74 p-4">
              <div className="text-xs tracking-[0.16em] text-slate-500">申込中</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
                {snapshot.reservations.length}
              </div>
            </div>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/74 p-5 text-sm leading-7 text-slate-600">
            Hobby / Biz は月4回付与、未使用分は上限まで繰越です。Pro は無制限で参加できます。返却期限外のキャンセルは返却対象外です。
          </div>
        </Card>
      </section>

      <BookingsCalendarPanel initialMonth={initialMonth} entries={calendarEntries} />

      <div className="grid gap-5">
        {snapshot.offerings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="現在受付中の募集枠はありません"
            description="新しい講義予約やイベントが公開されると、この一覧に表示されます。"
          />
        ) : snapshot.offerings.map((offering, index) => {
          const currentReservation = reservationMap.get(offering.id);

          return (
            <Card key={offering.id} id={`offering-${offering.id}`} className="dds-reveal overflow-hidden" data-delay={String(Math.min(index, 3))}>
              <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="brand">{offering.offeringType === "booking" ? "講義予約" : "イベント"}</Badge>
                    <Badge tone={offering.counts.isFull ? "warning" : "success"}>
                      定員 {offering.counts.confirmed}/{offering.capacity}
                    </Badge>
                    {offering.counts.waitlist > 0 ? <Badge tone="warning">待機 {offering.counts.waitlist}</Badge> : null}
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr]">
                    {offering.thumbnailUrl ? (
                      <PortalImage src={offering.thumbnailUrl} alt={offering.title} className="h-56 rounded-[24px]" />
                    ) : (
                      <div className="h-56 rounded-[24px] bg-[linear-gradient(135deg,#dae3ff,#f8f6ee)]" />
                    )}
                    <div>
                      <h2 className="font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">{offering.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{offering.summary}</p>
                      <div className="mt-5 grid gap-3 rounded-[24px] border border-black/8 bg-black/[0.02] p-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[var(--color-primary)]" /> {formatDate(offering.startsAt)}</div>
                        <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[var(--color-primary)]" /> 返却期限: {formatDate(offering.refundDeadline)}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--color-primary)]" /> {offering.locationLabel} / {offering.host}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] bg-[linear-gradient(180deg,#f1f5ff,#f7efe1)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Ticket className="h-4 w-4 text-[var(--color-primary)]" />
                    申込状態
                  </div>
                  <div className="mt-4 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
                    {currentReservation
                      ? "予約済み"
                      : offering.eligibility.allowed
                        ? offering.eligibility.waitlist
                          ? "待機申込"
                          : "申込可能"
                        : "申込不可"}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {currentReservation
                      ? "この募集枠に申し込み済みです。"
                      : offering.eligibility.allowed
                        ? `${offering.creditRequired}クレジット / ${offering.consumptionMode === "on_confirm" ? "予約確定時に消費" : "参加時に消費"}`
                        : offering.eligibility.reason}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-black/8 bg-white/76 p-4">
                      <div className="text-xs tracking-[0.14em] text-slate-500">残席</div>
                      <div className="mt-2 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
                        {offering.counts.remaining}
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-black/8 bg-white/76 p-4">
                      <div className="text-xs tracking-[0.14em] text-slate-500">必要クレジット</div>
                      <div className="mt-2 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
                        {offering.creditRequired}
                      </div>
                    </div>
                  </div>

                  {isDatabaseConfigured ? (
                    currentReservation ? (
                      <form action={cancelReservationAction} className="mt-5">
                        <input type="hidden" name="reservationId" value={currentReservation.id} />
                        <SubmitButton
                          pendingLabel="取消中..."
                          className="w-full bg-slate-800"
                          confirmMessage="この予約をキャンセルします。返却期限外の場合はクレジットが返却されません。"
                        >
                          予約をキャンセル
                        </SubmitButton>
                      </form>
                    ) : offering.eligibility.allowed ? (
                      <form action={bookOfferingAction} className="mt-5">
                        <input type="hidden" name="offeringId" value={offering.id} />
                        <SubmitButton pendingLabel="申込中..." className="w-full">
                          {offering.eligibility.waitlist ? "待機申込する" : "予約する"}
                        </SubmitButton>
                      </form>
                    ) : null
                  ) : (
                    <div className="mt-5 text-xs text-slate-500">
                      DB 接続後に申込操作が有効になります。
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
