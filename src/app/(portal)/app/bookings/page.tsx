import {
  getCalendarMonth,
  ScheduleCalendar,
  shiftCalendarMonth,
} from "@/components/ui/schedule-calendar";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PortalImage } from "@/components/ui/portal-image";
import { SubmitButton } from "@/components/ui/submit-button";
import { bookOfferingAction, cancelReservationAction } from "@/actions/member";
import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getPortalSnapshot } from "@/lib/portal";
import { formatDate, formatDateOnly } from "@/lib/utils";
import Link from "next/link";

type BookingsPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function BookingsPage({
  searchParams,
}: BookingsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const currentMonth = getCalendarMonth(params.month);
  const snapshot = await getPortalSnapshot(user);

  const calendarEntries = snapshot.offerings.map((offering) => ({
    id: offering.id,
    title: offering.title,
    startsAt: offering.startsAt,
    href: `#offering-${offering.id}`,
    badge: offering.offeringType === "booking" ? "講義予約" : "イベント",
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[linear-gradient(180deg,#eef3ff,#f6efe2)] text-slate-950">
          <div className="text-sm font-semibold text-slate-500">予約クレジット</div>
          <h1 className="mt-4 font-display text-3xl font-bold">
            {snapshot.plan.unlimitedCredits ? "クレジット無制限" : `残り ${snapshot.wallet.currentBalance} 回`}
          </h1>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[24px] border border-black/8 bg-white/72 p-4">
              <div className="text-sm text-slate-500">今月付与</div>
              <div className="mt-1 text-2xl font-bold">{snapshot.wallet.thisCycleGranted}</div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-white/72 p-4">
              <div className="text-sm text-slate-500">今月消費</div>
              <div className="mt-1 text-2xl font-bold">{snapshot.wallet.thisCycleConsumed}</div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-white/72 p-4">
              <div className="text-sm text-slate-500">次回付与日</div>
              <div className="mt-1 text-2xl font-bold">
                {snapshot.plan.unlimitedCredits ? "常時" : formatDateOnly(snapshot.wallet.nextGrantAt)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-500">予約カレンダー</div>
              <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">
                月ごとの予約枠を視覚的に確認
              </h2>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/app/bookings?month=${shiftCalendarMonth(currentMonth, -1)}`}
                className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                前月
              </Link>
              <Link
                href={`/app/bookings?month=${shiftCalendarMonth(currentMonth, 1)}`}
                className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                次月
              </Link>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            カレンダー内のカードを押すと、該当する予約枠の詳細に移動します。満席時は待機申込に切り替わります。
          </p>
        </Card>
      </section>

      <ScheduleCalendar month={currentMonth} entries={calendarEntries} emptyLabel="予定なし" />

      <div className="grid gap-5">
        {snapshot.offerings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="現在受付中の募集枠はありません"
            description="新しい講義予約やイベントが公開されると、この一覧に表示されます。"
          />
        ) : snapshot.offerings.map((offering) => {
          const currentReservation = snapshot.reservations.find(
            (reservation) => reservation.offeringId === offering.id && reservation.status === "confirmed",
          );

          return (
            <Card key={offering.id} id={`offering-${offering.id}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="brand">{offering.offeringType === "booking" ? "講義予約" : "イベント"}</Badge>
                    <Badge tone={offering.counts.isFull ? "warning" : "success"}>
                      定員 {offering.counts.confirmed}/{offering.capacity}
                    </Badge>
                  </div>
                  {offering.thumbnailUrl ? (
                    <PortalImage src={offering.thumbnailUrl} alt={offering.title} className="mt-4 h-52 rounded-[24px]" />
                  ) : null}
                  <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{offering.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{offering.summary}</p>
                  <div className="mt-4 text-sm text-slate-500">
                    {formatDate(offering.startsAt)} / {offering.locationLabel} / {offering.host}
                  </div>
                </div>
                <div className="rounded-[24px] bg-black/[0.03] p-5 lg:min-w-[340px]">
                  <div className="text-sm font-semibold text-slate-500">申込状態</div>
                  <div className="mt-2 text-lg font-bold text-slate-950">
                    {currentReservation
                      ? "予約済み"
                      : offering.eligibility.allowed
                        ? offering.eligibility.waitlist
                          ? "待機申込"
                          : "申込可能"
                        : "申込不可"}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {currentReservation
                      ? "この募集枠に申し込み済みです。"
                      : offering.eligibility.allowed
                        ? `${offering.creditRequired}クレジット / ${offering.consumptionMode === "on_confirm" ? "予約確定時に消費" : "参加時に消費"}`
                        : offering.eligibility.reason}
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    <div>返却期限: {formatDate(offering.refundDeadline)}</div>
                    <div>参加方法: {offering.locationLabel}</div>
                  </div>
                  {isDatabaseConfigured ? (
                    currentReservation ? (
                      <form action={cancelReservationAction} className="mt-4">
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
                      <form action={bookOfferingAction} className="mt-4">
                        <input type="hidden" name="offeringId" value={offering.id} />
                        <SubmitButton pendingLabel="申込中..." className="w-full">
                          {offering.eligibility.waitlist ? "待機申込する" : "予約する"}
                        </SubmitButton>
                      </form>
                    ) : null
                  ) : (
                    <div className="mt-4 text-xs text-slate-500">
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
