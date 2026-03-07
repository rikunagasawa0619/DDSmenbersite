import { createOfferingAction, markReservationStatusAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { listMembers, listOfferings, listReservations, listWaitlistEntries } from "@/lib/repository";
import { getOfferingCounts } from "@/lib/reservations";
import { formatDate } from "@/lib/utils";

export default async function AdminOfferingsPage() {
  await requireAdmin();
  const [offerings, reservations, waitlistEntries, members] = await Promise.all([
    listOfferings(),
    listReservations(),
    listWaitlistEntries(),
    listMembers(),
  ]);
  const memberMap = new Map(members.map((member) => [member.id, member]));

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Offerings
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">募集枠管理</h1>
      </div>

      {isDatabaseConfigured ? (
        <Card>
          <h2 className="font-display text-2xl font-bold text-slate-950">募集枠を追加</h2>
          <form action={createOfferingAction} className="mt-5 grid gap-4 xl:grid-cols-2">
            <input name="title" placeholder="タイトル" className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="summary" placeholder="概要" className="rounded-2xl border border-black/10 px-4 py-3" />
            <textarea name="description" placeholder="詳細説明" className="min-h-28 rounded-2xl border border-black/10 px-4 py-3 xl:col-span-2" />
            <select name="offeringType" className="rounded-2xl border border-black/10 px-4 py-3">
              <option value="BOOKING">BOOKING</option>
              <option value="EVENT">EVENT</option>
            </select>
            <input name="locationLabel" placeholder="Zoom / Tokyo" className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="startsAt" type="datetime-local" className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="endsAt" type="datetime-local" className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="refundDeadline" type="datetime-local" className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="host" placeholder="講師名" className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="priceLabel" placeholder="Pro限定 / クレジット1" className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="capacity" type="number" defaultValue={20} className="rounded-2xl border border-black/10 px-4 py-3" />
            <input name="creditRequired" type="number" defaultValue={1} className="rounded-2xl border border-black/10 px-4 py-3" />
            <select name="consumptionMode" className="rounded-2xl border border-black/10 px-4 py-3">
              <option value="ON_CONFIRM">ON_CONFIRM</option>
              <option value="ON_ATTEND">ON_ATTEND</option>
            </select>
            <input name="externalJoinUrl" placeholder="参加URL（任意）" className="rounded-2xl border border-black/10 px-4 py-3" />
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 xl:col-span-2">
              <label><input type="checkbox" name="planCodes" value="HOBBY" /> Hobby</label>
              <label><input type="checkbox" name="planCodes" value="BIZ" /> Biz</label>
              <label><input type="checkbox" name="planCodes" value="PRO" /> Pro</label>
              <label><input type="checkbox" name="waitlistEnabled" defaultChecked /> Waitlist</label>
              <label><input type="checkbox" name="featured" /> Featured</label>
            </div>
            <div className="xl:col-span-2">
              <SubmitButton pendingLabel="追加中...">募集枠を追加</SubmitButton>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-5">
        {offerings.map((offering) => {
          const counts = getOfferingCounts(
            offering,
            reservations,
            waitlistEntries,
          );
          const offeringReservations = reservations.filter(
            (reservation) => reservation.offeringId === offering.id,
          );
          const offeringWaitlist = waitlistEntries.filter((entry) => entry.offeringId === offering.id);

          return (
            <Card key={offering.id}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    {offering.offeringType === "booking" ? "講義予約" : "限定イベント"}
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">{offering.title}</h2>
                  <div className="mt-3 text-sm text-slate-600">
                    {formatDate(offering.startsAt)} / {offering.locationLabel}
                  </div>
                </div>
                <div className="grid min-w-[320px] gap-2 rounded-[24px] bg-black/[0.03] p-4 text-sm text-slate-600">
                  <div>定員: {counts.confirmed}/{offering.capacity}</div>
                  <div>待機: {counts.waitlist}</div>
                  <div>消費タイミング: {offering.consumptionMode}</div>
                  <div>返却期限: {formatDate(offering.refundDeadline)}</div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-black/6 p-4">
                  <div className="text-sm font-semibold text-slate-500">予約一覧</div>
                  <div className="mt-4 space-y-3">
                    {offeringReservations.length === 0 ? (
                      <div className="text-sm text-slate-500">予約はありません。</div>
                    ) : (
                      offeringReservations.map((reservation) => {
                        const member = memberMap.get(reservation.userId);
                        return (
                          <div
                            key={reservation.id}
                            className="rounded-2xl bg-black/[0.03] p-4"
                          >
                            <div className="font-semibold text-slate-950">
                              {member?.name ?? reservation.userId}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {member?.email ?? "unknown"} / {reservation.status}
                            </div>
                            {isDatabaseConfigured && reservation.status === "confirmed" ? (
                              <div className="mt-3 flex flex-wrap gap-3">
                                <form action={markReservationStatusAction}>
                                  <input type="hidden" name="reservationId" value={reservation.id} />
                                  <input type="hidden" name="status" value="ATTENDED" />
                                  <SubmitButton pendingLabel="更新中..." className="bg-emerald-600">
                                    参加済み
                                  </SubmitButton>
                                </form>
                                <form action={markReservationStatusAction}>
                                  <input type="hidden" name="reservationId" value={reservation.id} />
                                  <input type="hidden" name="status" value="NO_SHOW" />
                                  <SubmitButton pendingLabel="更新中..." className="bg-slate-800">
                                    欠席
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
                              {member?.email ?? "unknown"} / 登録: {formatDate(entry.createdAt)}
                            </div>
                          </div>
                        );
                      })
                    )}
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
