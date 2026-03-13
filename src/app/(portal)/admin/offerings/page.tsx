import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { markReservationStatusAction } from "@/actions/admin";
import { AdminOfferingsCalendarPanel } from "@/components/admin/admin-offerings-calendar-panel";
import {
  getMinimumPlanCodeFromAudience,
  labelConsumptionMode,
  labelMinimumPlan,
  labelOfferingType,
  labelReservationStatus,
} from "@/lib/admin-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PortalImage } from "@/components/ui/portal-image";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import {
  getOfferingCountMap,
  listMembersByIds,
  listOfferings,
  listReservations,
  listWaitlistEntries,
} from "@/lib/repository";
import { getCalendarMonth, getDayKey, shiftCalendarMonth } from "@/components/ui/schedule-calendar";
import { getOfferingCountsFromSummary } from "@/lib/reservations";
import { formatDate, formatDateOnly } from "@/lib/utils";

export default async function AdminOfferingsPage() {
  await requireAdmin();
  const [offerings, reservations, waitlistEntries, offeringCountMap] = await Promise.all([
    listOfferings(),
    listReservations(),
    listWaitlistEntries(),
    getOfferingCountMap(),
  ]);

  const memberIds = Array.from(
    new Set([
      ...reservations.map((reservation) => reservation.userId),
      ...waitlistEntries.map((entry) => entry.userId),
    ]),
  );
  const members = await listMembersByIds(memberIds);
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const reservationsByOffering = new Map<string, typeof reservations>();
  const waitlistByOffering = new Map<string, typeof waitlistEntries>();

  for (const reservation of reservations) {
    const bucket = reservationsByOffering.get(reservation.offeringId) ?? [];
    bucket.push(reservation);
    reservationsByOffering.set(reservation.offeringId, bucket);
  }

  for (const entry of waitlistEntries) {
    const bucket = waitlistByOffering.get(entry.offeringId) ?? [];
    bucket.push(entry);
    waitlistByOffering.set(entry.offeringId, bucket);
  }

  const initialMonth = shiftCalendarMonth(getCalendarMonth(), 0);
  const calendarEntries = offerings.map((offering) => ({
    id: offering.id,
    title: offering.title,
    startsAt: offering.startsAt,
    href: `#offering-${offering.id}`,
    badge: labelOfferingType(offering.offeringType),
  }));

  const featuredOffering = offerings.find((offering) => offering.featured) ?? offerings[0];
  const nextOfferings = offerings
    .filter((offering) => getDayKey(offering.startsAt) >= getDayKey(new Date()))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="dds-reveal dds-tile relative overflow-hidden bg-[linear-gradient(135deg,#eef3ff,#f7f1e4_52%,#ffffff)] text-slate-950">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-[rgba(45,91,255,0.24)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[rgba(215,255,100,0.14)] blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="dds-kicker text-[var(--color-primary)]">募集枠管理</div>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950 md:text-5xl">
                予定を置く、埋まり具合を見る、
                <br />
                運営判断まで一気に進める。
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
                カレンダーからそのまま募集枠を作成できるようにして、一覧への往復を減らしました。公開中の枠、予約数、待機状況を同じ視界で確認できます。
              </p>
            </div>
            {featuredOffering ? (
              <div className="w-full max-w-[360px] rounded-[28px] border border-black/8 bg-white/78 p-5 shadow-[0_24px_56px_rgba(15,23,42,0.08)]">
                <div className="dds-kicker text-slate-500">注目の募集枠</div>
                <div className="mt-3 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                  {featuredOffering.title}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">{featuredOffering.summary}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="brand">{labelOfferingType(featuredOffering.offeringType)}</Badge>
                  <Badge tone="accent">{labelMinimumPlan(getMinimumPlanCodeFromAudience(featuredOffering.audience?.planCodes))}</Badge>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="dds-reveal grid gap-4 bg-[linear-gradient(180deg,#10182b,#1a2741)] text-white" data-delay="1">
          <div className="dds-kicker text-white/60">直近の予定</div>
          {nextOfferings.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/72">
              これから始まる募集枠はまだありません。
            </div>
          ) : (
            nextOfferings.map((offering) => (
              <div key={offering.id} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{offering.title}</div>
                  <Badge tone="accent">{labelOfferingType(offering.offeringType)}</Badge>
                </div>
                <div className="mt-2 text-sm text-white/70">
                  {formatDate(offering.startsAt)} / {offering.locationLabel}
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      <AdminOfferingsCalendarPanel
        initialMonth={initialMonth}
        entries={calendarEntries}
        totalOfferings={offerings.length}
        totalReservations={reservations.length}
        totalWaitlist={waitlistEntries.length}
      />

      <div className="grid gap-5">
        {offerings.map((offering, index) => {
          const counts = getOfferingCountsFromSummary(offering, offeringCountMap[offering.id]);
          const offeringReservations = reservationsByOffering.get(offering.id) ?? [];
          const offeringWaitlist = waitlistByOffering.get(offering.id) ?? [];
          const minimumPlan = getMinimumPlanCodeFromAudience(offering.audience?.planCodes);

          return (
            <Card key={offering.id} id={`offering-${offering.id}`} className="dds-reveal overflow-hidden" data-delay={String(Math.min(index, 3))}>
              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="brand">{labelOfferingType(offering.offeringType)}</Badge>
                    <Badge tone="accent">{labelMinimumPlan(minimumPlan)}</Badge>
                    <Badge tone={counts.isFull ? "warning" : "success"}>
                      定員 {counts.confirmed}/{offering.capacity}
                    </Badge>
                    {counts.waitlist > 0 ? <Badge tone="warning">待機 {counts.waitlist}</Badge> : null}
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[0.72fr_1fr]">
                    {offering.thumbnailUrl ? (
                      <PortalImage src={offering.thumbnailUrl} alt={offering.title} className="h-64 rounded-[26px]" />
                    ) : (
                      <div className="h-64 rounded-[26px] bg-[linear-gradient(135deg,#dae3ff,#f8f6ee)]" />
                    )}
                    <div>
                      <h2 className="font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">{offering.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{offering.description}</p>
                      <div className="mt-5 grid gap-3 rounded-[24px] border border-black/8 bg-black/[0.02] p-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[var(--color-primary)]" /> 開始: {formatDate(offering.startsAt)}</div>
                        <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[var(--color-primary)]" /> 終了: {formatDate(offering.endsAt)}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--color-primary)]" /> 開催場所: {offering.locationLabel}</div>
                        <div>講師 / 主催: {offering.host}</div>
                        <div>必要クレジット: {offering.creditRequired} 回</div>
                        <div>消費タイミング: {labelConsumptionMode(offering.consumptionMode)}</div>
                        <div>参加URL: {offering.externalJoinUrl || "未設定"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[26px] border border-black/8 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-950">予約一覧</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {offeringReservations.length} 件
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {offeringReservations.length === 0 ? (
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-slate-500">まだ予約はありません。</div>
                      ) : (
                        offeringReservations.slice(0, 8).map((reservation) => {
                          const member = memberMap.get(reservation.userId);
                          return (
                            <div key={reservation.id} className="rounded-[22px] bg-black/[0.03] p-4">
                              <div className="font-semibold text-slate-950">{member?.name ?? reservation.userId}</div>
                              <div className="mt-1 text-sm text-slate-600">
                                {member?.email ?? "不明"} / {labelReservationStatus(reservation.status)}
                              </div>
                              {isDatabaseConfigured && reservation.status === "confirmed" ? (
                                <div className="mt-3 flex flex-wrap gap-3">
                                  <form action={markReservationStatusAction}>
                                    <input type="hidden" name="reservationId" value={reservation.id} />
                                    <input type="hidden" name="status" value="ATTENDED" />
                                    <SubmitButton
                                      pendingLabel="更新中..."
                                      className="bg-emerald-600"
                                      confirmMessage="この予約を参加済みに更新します。クレジット消費が発生する場合があります。"
                                    >
                                      参加済みにする
                                    </SubmitButton>
                                  </form>
                                  <form action={markReservationStatusAction}>
                                    <input type="hidden" name="reservationId" value={reservation.id} />
                                    <input type="hidden" name="status" value="NO_SHOW" />
                                    <SubmitButton
                                      pendingLabel="更新中..."
                                      className="bg-slate-800"
                                      confirmMessage="この予約を欠席に更新します。返却されない可能性があります。"
                                    >
                                      欠席にする
                                    </SubmitButton>
                                  </form>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-black/8 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-950">待機一覧</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {offeringWaitlist.length} 件
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {offeringWaitlist.length === 0 ? (
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-slate-500">待機はありません。</div>
                      ) : (
                        offeringWaitlist.slice(0, 8).map((entry) => {
                          const member = memberMap.get(entry.userId);
                          return (
                            <div key={entry.id} className="rounded-[22px] bg-black/[0.03] p-4">
                              <div className="font-semibold text-slate-950">{member?.name ?? entry.userId}</div>
                              <div className="mt-1 text-sm text-slate-600">
                                {member?.email ?? "不明"} / 登録日: {formatDateOnly(entry.createdAt)}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
