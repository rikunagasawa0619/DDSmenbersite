import { runMonthlyCreditGrantAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { listMembershipPlans, listMembers } from "@/lib/repository";

export default async function AdminPlansPage() {
  await requireAdmin();
  const [plans, members] = await Promise.all([listMembershipPlans(), listMembers()]);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Plans & Credits
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">プラン / クレジット</h1>
        <form action={runMonthlyCreditGrantAction} className="mt-4">
          <SubmitButton pendingLabel="実行中...">月次クレジット付与を今すぐ実行</SubmitButton>
        </form>
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.code} className={plan.code === "PRO" ? "bg-[#111b2f] text-white" : ""}>
            <div className="text-sm font-semibold opacity-70">{plan.code}</div>
            <h2 className="mt-3 font-display text-3xl font-bold">{plan.name}</h2>
            <p className="mt-3 text-sm leading-7 opacity-80">{plan.description}</p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-[22px] bg-black/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] opacity-55">月次付与</div>
                <div className="mt-2 text-2xl font-bold">
                  {plan.unlimitedCredits ? "無制限" : `${plan.monthlyCreditGrant}回`}
                </div>
              </div>
              <div className="rounded-[22px] bg-black/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] opacity-55">繰越上限</div>
                <div className="mt-2 text-2xl font-bold">
                  {plan.unlimitedCredits ? "∞" : `${plan.rolloverCap}回`}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <h2 className="font-display text-2xl font-bold text-slate-950">手動付与・残高補正の設計メモ</h2>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-black/6 p-5">
            <div className="font-semibold text-slate-950">Bonus grant</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              キャンペーンや救済対応で加算。運営判断で残高上限を超える補填も可能です。
            </p>
          </div>
          <div className="rounded-[24px] border border-black/6 p-5">
            <div className="font-semibold text-slate-950">Balance adjustment</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              調整理由を必須にし、監査ログを残した上で残高差分を補正します。
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-[24px] bg-black/[0.03] p-5 text-sm leading-7 text-slate-600">
          適用中の会員数: {members.length} / プラン定義数: {plans.length}
        </div>
        <div className="mt-4 rounded-[24px] border border-black/6 p-5 text-sm leading-7 text-slate-600">
          本番では Vercel Cron 等から `/api/cron/monthly-credits` を定期実行してください。
        </div>
      </Card>
    </div>
  );
}
