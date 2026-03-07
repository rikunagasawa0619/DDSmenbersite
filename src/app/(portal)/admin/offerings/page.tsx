/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { createOfferingAction, markReservationStatusAction } from "@/actions/admin";
import {
  getMinimumPlanCodeFromAudience,
  labelConsumptionMode,
  labelMinimumPlan,
  labelOfferingType,
  labelReservationStatus,
} from "@/lib/admin-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getCalendarMonth,
  ScheduleCalendar,
  shiftCalendarMonth,
} from "@/components/ui/schedule-calendar";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import {
  listMembers,
  listOfferings,
  listReservations,
  listWaitlistEntries,
} from "@/lib/repository";
import { getOfferingCounts } from "@/lib/reservations";
import { formatDate, formatDateOnly } from "@/lib/utils";

type OfferingsPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

const minimumPlanOptions = [
  { value: "HOBBY", label: "DDS Hobby 以上" },
  { value: "BIZ", label: "DDS Biz 以上" },
  { value: "PRO", label: "DDS Pro のみ" },
];

export default async function AdminOfferingsPage({
  searchParams,
}: OfferingsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const currentMonth = getCalendarMonth(params.month);
  const [offerings, reservations, waitlistEntries, members] = await Promise.all([
    listOfferings(),
    listReservations(),
    listWaitlistEntries(),
    listMembers(),
  ]);
  const memberMap = new Map(members.map((member) => [member.id, member]));

  const calendarEntries = offerings.map((offering) => ({
    id: offering.id,
    title: offering.title,
    startsAt: offering.startsAt,
    href: `#offering-${offering.id}`,
    badge: labelOfferingType(offering.offeringType),
  }));

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
          募集枠管理
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">
          カレンダーで予約枠を見ながら編集
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          イベントと講義予約を同じカレンダーで管理します。対象プランは「DDS Biz 以上」「DDS Pro のみ」のような簡単な指定方式です。
        </p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-500">募集カレンダー</div>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                月ごとの公開スケジュール
              </h2>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/admin/offerings?month=${shiftCalendarMonth(currentMonth, -1)}`}
                className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                前月
              </Link>
              <Link
                href={`/admin/offerings?month=${shiftCalendarMonth(currentMonth, 1)}`}
                className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                次月
              </Link>
            </div>
          </div>
          <ScheduleCalendar
            month={currentMonth}
            entries={calendarEntries}
            emptyLabel="予定なし"
          />
        </Card>

        {isDatabaseConfigured ? (
          <Card>
            <h2 className="font-display text-2xl font-bold text-slate-950">新しい募集枠を作成</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              終了日時を空欄にすると 1 時間後、返却期限を空欄にすると開始時刻までを返却対象として扱います。
            </p>
            <form action={createOfferingAction} className="mt-5 grid gap-3">
              <input name="title" placeholder="募集枠タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <input name="summary" placeholder="一覧用の短い説明" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <textarea name="description" placeholder="詳細説明" className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <input name="thumbnailUrl" placeholder="サムネイル画像URL（任意）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <div className="grid gap-3 md:grid-cols-2">
                <select name="offeringType" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <option value="BOOKING">講義予約</option>
                  <option value="EVENT">イベント</option>
                </select>
                <input name="locationLabel" placeholder="開催場所 例: Zoom / 渋谷" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">開始日時</span>
                  <input name="startsAt" type="datetime-local" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">終了日時</span>
                  <input name="endsAt" type="datetime-local" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">返却期限</span>
                  <input name="refundDeadline" type="datetime-local" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">講師 / 主催</span>
                  <input name="host" placeholder="講師名" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">定員</span>
                  <input name="capacity" type="number" defaultValue={20} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-500">必要クレジット</span>
                  <input name="creditRequired" type="number" defaultValue={1} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select name="consumptionMode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <option value="ON_CONFIRM">予約確定時に消費</option>
                  <option value="ON_ATTEND">参加確定時に消費</option>
                </select>
                <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  {minimumPlanOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <input name="priceLabel" placeholder="表示ラベル 例: 1クレジット / 無料" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <input name="externalJoinUrl" placeholder="参加URL（任意）" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <div className="flex flex-wrap gap-4 rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-slate-600">
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="waitlistEnabled" defaultChecked /> 満席時は待機受付</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="featured" /> ホームに優先表示</label>
              </div>
              <SubmitButton pendingLabel="作成中...">募集枠を作成</SubmitButton>
            </form>
          </Card>
        ) : null}
      </section>

      <div className="grid gap-5">
        {offerings.map((offering) => {
          const counts = getOfferingCounts(offering, reservations, waitlistEntries);
          const offeringReservations = reservations.filter(
            (reservation) => reservation.offeringId === offering.id,
          );
          const offeringWaitlist = waitlistEntries.filter((entry) => entry.offeringId === offering.id);
          const minimumPlan = getMinimumPlanCodeFromAudience(offering.audience?.planCodes);

          return (
            <Card key={offering.id} id={`offering-${offering.id}`} className="overflow-hidden">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone="brand">{labelOfferingType(offering.offeringType)}</Badge>
                        <Badge tone="accent">{labelMinimumPlan(minimumPlan)}</Badge>
                        <Badge tone={counts.isFull ? "warning" : "success"}>
                          定員 {counts.confirmed}/{offering.capacity}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="font-display text-2xl font-bold text-slate-950">{offering.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{offering.description}</p>
                      </div>
                      {offering.thumbnailUrl ? (
                        <img
                          src={offering.thumbnailUrl}
                          alt={offering.title}
                          className="h-48 w-full rounded-[24px] object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="grid min-w-[320px] gap-2 rounded-[24px] border border-black/6 bg-black/[0.03] p-4 text-sm text-slate-600">
                      <div>開始日時: {formatDate(offering.startsAt)}</div>
                      <div>終了日時: {formatDate(offering.endsAt)}</div>
                      <div>返却期限: {formatDate(offering.refundDeadline)}</div>
                      <div>開催場所: {offering.locationLabel}</div>
                      <div>講師 / 主催: {offering.host}</div>
                      <div>必要クレジット: {offering.creditRequired} 回</div>
                      <div>消費タイミング: {labelConsumptionMode(offering.consumptionMode)}</div>
                      <div>待機人数: {counts.waitlist}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-[24px] border border-black/6 p-4">
                      <div className="text-sm font-semibold text-slate-500">予約一覧</div>
                      <div className="mt-4 space-y-3">
                        {offeringReservations.length === 0 ? (
                          <div className="text-sm text-slate-500">予約はまだありません。</div>
                        ) : (
                          offeringReservations.map((reservation) => {
                            const member = memberMap.get(reservation.userId);
                            return (
                              <div key={reservation.id} className="rounded-2xl bg-black/[0.03] p-4">
                                <div className="font-semibold text-slate-950">
                                  {member?.name ?? reservation.userId}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                  {member?.email ?? "不明"} / {labelReservationStatus(reservation.status)}
                                </div>
                                {isDatabaseConfigured && reservation.status === "confirmed" ? (
                                  <div className="mt-3 flex flex-wrap gap-3">
                                    <form action={markReservationStatusAction}>
                                      <input type="hidden" name="reservationId" value={reservation.id} />
                                      <input type="hidden" name="status" value="ATTENDED" />
                                      <SubmitButton pendingLabel="更新中..." className="bg-emerald-600">
                                        参加済みにする
                                      </SubmitButton>
                                    </form>
                                    <form action={markReservationStatusAction}>
                                      <input type="hidden" name="reservationId" value={reservation.id} />
                                      <input type="hidden" name="status" value="NO_SHOW" />
                                      <SubmitButton pendingLabel="更新中..." className="bg-slate-800">
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

                    <div className="rounded-[24px] border border-black/6 p-4">
                      <div className="text-sm font-semibold text-slate-500">待機一覧</div>
                      <div className="mt-4 space-y-3">
                        {offeringWaitlist.length === 0 ? (
                          <div className="text-sm text-slate-500">待機はありません。</div>
                        ) : (
                          offeringWaitlist.map((entry) => {
                            const member = memberMap.get(entry.userId);
                            return (
                              <div key={entry.id} className="rounded-2xl bg-black/[0.03] p-4">
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

                <div className="rounded-[28px] bg-[#10182b] p-5 text-white">
                  <div className="text-sm font-semibold text-white/60">運用メモ</div>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-[22px] bg-white/8 p-4">
                      <div className="text-xs tracking-[0.18em] text-white/45">表示ラベル</div>
                      <div className="mt-2 text-lg font-bold">{offering.priceLabel || "未設定"}</div>
                    </div>
                    <div className="rounded-[22px] bg-white/8 p-4">
                      <div className="text-xs tracking-[0.18em] text-white/45">参加URL</div>
                      <div className="mt-2 break-all text-sm text-white/80">
                        {offering.externalJoinUrl || "未設定"}
                      </div>
                    </div>
                    <div className="rounded-[22px] bg-white/8 p-4 text-sm leading-7 text-white/75">
                      終了日時を短くしすぎると会員側の予定が見づらくなるため、講義は 60 分以上を目安に設定してください。
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
