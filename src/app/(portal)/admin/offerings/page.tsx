/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

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
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Modal } from "@/components/ui/modal";
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
    create?: string;
    start?: string;
  }>;
};

const minimumPlanOptions = [
  { value: "HOBBY", label: "DDS Hobby 以上" },
  { value: "BIZ", label: "DDS Biz 以上" },
  { value: "PRO", label: "DDS Pro のみ" },
];

function getDefaultStartValue(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value)) {
    return value.includes("T") ? value : `${value}T20:00`;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T20:00`;
}

function CreateOfferingModal({
  closeHref,
  defaultStart,
}: {
  closeHref: string;
  defaultStart: string;
}) {
  return (
    <Modal
      title="募集枠を作成"
      closeHref={closeHref}
      size="xl"
    >
      <form action={createOfferingAction} className="dds-admin-form grid gap-5" encType="multipart/form-data">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">募集枠タイトル</span>
            <input name="title" placeholder="例: 3月グループコンサル" className="dds-admin-input" />
          </label>
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">種別</span>
            <select name="offeringType" className="dds-admin-select">
              <option value="BOOKING">講義予約</option>
              <option value="EVENT">イベント</option>
            </select>
          </label>
        </div>

        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">一覧用の要約</span>
          <textarea name="summary" placeholder="カレンダーや一覧カードに表示する短い説明" className="dds-admin-textarea min-h-24" />
        </label>

        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">詳細説明</span>
          <textarea name="description" placeholder="参加対象、内容、持ち物、注意事項などを記載" className="dds-admin-textarea min-h-32" />
        </label>

        <ImageUploadField name="thumbnailFile" label="募集枠サムネイル" hint="カード表示用。Cloudflare R2 に保存します。" />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">開始日時</span>
            <input name="startsAt" type="datetime-local" defaultValue={defaultStart} className="dds-admin-input" />
          </label>
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">終了日時</span>
            <input name="endsAt" type="datetime-local" className="dds-admin-input" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">開催場所</span>
            <input name="locationLabel" placeholder="Zoom / 渋谷 / 大阪" className="dds-admin-input" />
          </label>
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">講師 / 主催</span>
            <input name="host" placeholder="講師名" className="dds-admin-input" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">定員</span>
            <input name="capacity" type="number" defaultValue={20} className="dds-admin-input" />
          </label>
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">必要クレジット</span>
            <input name="creditRequired" type="number" defaultValue={1} className="dds-admin-input" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">クレジット消費タイミング</span>
            <select name="consumptionMode" className="dds-admin-select">
              <option value="ON_CONFIRM">予約確定時に消費</option>
              <option value="ON_ATTEND">参加済みにしたときに消費</option>
            </select>
          </label>
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">対象プラン</span>
            <select name="minimumPlanCode" className="dds-admin-select">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">返却期限</span>
            <input name="refundDeadline" type="datetime-local" className="dds-admin-input" />
          </label>
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">表示ラベル</span>
            <input name="priceLabel" placeholder="例: 1クレジット / 無料" className="dds-admin-input" />
          </label>
        </div>

        <label className="dds-admin-label">
          <span className="text-sm font-semibold text-slate-500">参加URL（任意）</span>
          <input name="externalJoinUrl" placeholder="Zoom URL など" className="dds-admin-input" />
        </label>

        <div className="grid gap-3 rounded-[24px] bg-black/[0.03] p-4 text-sm text-slate-700 md:grid-cols-2">
          <label className="inline-flex items-center gap-3">
            <input type="checkbox" name="waitlistEnabled" defaultChecked />
            満席時は待機受付を有効にする
          </label>
          <label className="inline-flex items-center gap-3">
            <input type="checkbox" name="featured" />
            ホームに優先表示する
          </label>
        </div>

        <div className="flex justify-end">
          <SubmitButton pendingLabel="作成中...">募集枠を保存</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="dds-kicker text-[var(--color-primary)]">募集枠管理</div>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">募集枠</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/offerings?month=${shiftCalendarMonth(currentMonth, -1)}`}
            className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            前月
          </Link>
          <Link
            href={`/admin/offerings?month=${shiftCalendarMonth(currentMonth, 1)}`}
            className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            次月
          </Link>
          <Link
            href={`/admin/offerings?month=${params.month ?? shiftCalendarMonth(currentMonth, 0)}&create=offering`}
            className="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_rgba(18,56,198,0.22)] transition hover:opacity-90"
          >
            新しい募集枠
          </Link>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="dds-kicker text-slate-500">月間カレンダー</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">カレンダー</h2>
            </div>
            <div className="rounded-full bg-[var(--color-primary)]/8 px-4 py-2 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              {offerings.length} 件の募集枠
            </div>
          </div>
          <ScheduleCalendar
            month={currentMonth}
            entries={calendarEntries}
            emptyLabel="ここから作成"
            dayHrefBuilder={(dayKey) =>
              `/admin/offerings?month=${params.month ?? shiftCalendarMonth(currentMonth, 0)}&create=offering&start=${dayKey}`
            }
          />
        </Card>

        <Card className="grid gap-4 bg-[linear-gradient(180deg,#edf3ff,#f5efe2)] text-slate-950 md:grid-cols-3">
          <div className="rounded-[24px] border border-black/8 bg-white/72 p-5">
            <div className="text-xs tracking-[0.18em] text-slate-500">総枠数</div>
            <div className="mt-3 font-display text-4xl font-bold">{offerings.length}</div>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/72 p-5">
            <div className="text-xs tracking-[0.18em] text-slate-500">予約数</div>
            <div className="mt-3 font-display text-4xl font-bold">{reservations.length}</div>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/72 p-5">
            <div className="text-xs tracking-[0.18em] text-slate-500">待機数</div>
            <div className="mt-3 font-display text-4xl font-bold">{waitlistEntries.length}</div>
          </div>
        </Card>
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
                      <img
                        src={offering.thumbnailUrl}
                        alt={offering.title}
                        className="h-64 w-full rounded-[26px] object-cover"
                      />
                    ) : (
                      <div className="h-64 rounded-[26px] bg-[linear-gradient(135deg,#dae3ff,#f8f6ee)]" />
                    )}
                    <div>
                      <h2 className="font-display text-3xl font-bold text-slate-950">{offering.title}</h2>
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
                    <div className="font-semibold text-slate-950">予約一覧</div>
                    <div className="mt-4 space-y-3">
                      {offeringReservations.length === 0 ? (
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-slate-500">まだ予約はありません。</div>
                      ) : (
                        offeringReservations.map((reservation) => {
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

                  <div className="rounded-[26px] border border-black/8 bg-white p-4">
                    <div className="font-semibold text-slate-950">待機一覧</div>
                    <div className="mt-4 space-y-3">
                      {offeringWaitlist.length === 0 ? (
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-slate-500">待機はありません。</div>
                      ) : (
                        offeringWaitlist.map((entry) => {
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

      {params.create === "offering" ? (
        <CreateOfferingModal
          closeHref={`/admin/offerings?month=${params.month ?? shiftCalendarMonth(currentMonth, 0)}`}
          defaultStart={getDefaultStartValue(params.start)}
        />
      ) : null}
    </div>
  );
}
