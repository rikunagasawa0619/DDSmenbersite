import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { bookOfferingAction, cancelReservationAction } from "@/actions/member";
import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getPortalSnapshot } from "@/lib/portal";
import { formatDate } from "@/lib/utils";

export default async function BookingsPage() {
  const user = await requireUser();
  const snapshot = await getPortalSnapshot(user);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[#111b2f] text-white">
          <div className="text-sm font-semibold text-white/65">Credit ledger</div>
          <h1 className="mt-4 font-display text-3xl font-bold">
            {snapshot.plan.unlimitedCredits ? "クレジット無制限" : `残り ${snapshot.wallet.currentBalance} 回`}
          </h1>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[24px] bg-white/8 p-4">
              <div className="text-sm text-white/65">今月付与</div>
              <div className="mt-1 text-2xl font-bold">{snapshot.wallet.thisCycleGranted}</div>
            </div>
            <div className="rounded-[24px] bg-white/8 p-4">
              <div className="text-sm text-white/65">今月消費</div>
              <div className="mt-1 text-2xl font-bold">{snapshot.wallet.thisCycleConsumed}</div>
            </div>
            <div className="rounded-[24px] bg-white/8 p-4">
              <div className="text-sm text-white/65">繰越</div>
              <div className="mt-1 text-2xl font-bold">{snapshot.wallet.carriedOver}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-slate-500">募集枠ルール</div>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">
            予約と限定イベントを同じ基盤で管理
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <li>募集枠ごとに定員、待機、消費タイミング、返却期限を設定。</li>
            <li>満席時は待機登録のみ行い、繰上げ確定で消費。</li>
            <li>Pro は全講義予約が無制限、Hobby/Biz は残高判定あり。</li>
            <li>他者へのクレジット譲渡は不可。</li>
          </ul>
        </Card>
      </section>

      <div className="grid gap-5">
        {snapshot.offerings.map((offering) => {
          const currentReservation = snapshot.reservations.find(
            (reservation) => reservation.offeringId === offering.id && reservation.status === "confirmed",
          );

          return (
            <Card key={offering.id}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Badge tone="brand">{offering.offeringType === "booking" ? "講義予約" : "限定イベント"}</Badge>
                    <Badge tone={offering.counts.isFull ? "warning" : "success"}>
                      定員 {offering.counts.confirmed}/{offering.capacity}
                    </Badge>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{offering.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{offering.summary}</p>
                  <div className="mt-4 text-sm text-slate-500">
                    {formatDate(offering.startsAt)} / {offering.locationLabel} / {offering.host}
                  </div>
                </div>
                <div className="rounded-[24px] bg-black/[0.03] p-5 lg:min-w-[320px]">
                  <div className="text-sm font-semibold text-slate-500">申込判定</div>
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
                      ? "現在この募集枠に参加予定です。"
                      : offering.eligibility.allowed
                        ? `${offering.creditRequired}クレジット / ${offering.consumptionMode === "on_confirm" ? "予約確定時消費" : "参加時消費"}`
                        : offering.eligibility.reason}
                  </div>
                  <div className="mt-4 text-xs text-slate-500">
                    返却期限: {formatDate(offering.refundDeadline)}
                  </div>
                  {isDatabaseConfigured ? (
                    currentReservation ? (
                      <form action={cancelReservationAction} className="mt-4">
                        <input type="hidden" name="reservationId" value={currentReservation.id} />
                        <SubmitButton pendingLabel="取消中..." className="w-full bg-slate-800">
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
