import { runMonthlyCreditGrantAction, savePlanSettingsAction } from "@/actions/admin";
import { labelCycleBasis, labelPlan } from "@/lib/admin-display";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { listMembershipPlans, listMembers } from "@/lib/repository";

export default async function AdminPlansPage() {
  await requireAdmin();
  const [plans, members] = await Promise.all([listMembershipPlans(), listMembers()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
            プラン / クレジット
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">プラン / クレジット</h1>
        </div>
        <form action={runMonthlyCreditGrantAction}>
          <SubmitButton pendingLabel="実行中...">月次クレジット付与を今すぐ実行</SubmitButton>
        </form>
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.code} className={plan.code === "PRO" ? "border-[var(--color-primary)]/12 bg-[linear-gradient(180deg,#edf3ff,#f5efe2)] text-slate-950" : ""}>
            <div className="text-sm font-semibold text-slate-600">
              {labelPlan(plan.code)}
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold">{plan.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {plan.description}
            </p>
            <div className="mt-6 grid gap-3">
              <div className={plan.code === "PRO" ? "rounded-[22px] border border-black/8 bg-white/76 p-4" : "rounded-[22px] bg-black/[0.05] p-4"}>
                <div className="text-xs tracking-[0.18em] text-slate-500">
                  月次付与
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {plan.unlimitedCredits ? "無制限" : `${plan.monthlyCreditGrant}回`}
                </div>
              </div>
              <div className={plan.code === "PRO" ? "rounded-[22px] border border-black/8 bg-white/76 p-4" : "rounded-[22px] bg-black/[0.05] p-4"}>
                <div className="text-xs tracking-[0.18em] text-slate-500">
                  繰越上限
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {plan.unlimitedCredits ? "∞" : `${plan.rolloverCap}回`}
                </div>
              </div>
              <div className={plan.code === "PRO" ? "rounded-[22px] border border-black/8 bg-white/76 p-4" : "rounded-[22px] bg-black/[0.05] p-4"}>
                <div className="text-xs tracking-[0.18em] text-slate-500">
                  付与ルール
                </div>
                <div className="mt-2 text-lg font-bold">{labelCycleBasis(plan.cycleBasis)}</div>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={`${plan.code}-form`}>
            <form action={savePlanSettingsAction} className="grid gap-3">
              <input type="hidden" name="planCode" value={plan.code} />
              <div className="font-display text-2xl font-bold text-slate-950">
                {labelPlan(plan.code)} の設定
              </div>
              <input name="name" defaultValue={plan.name} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <input name="heroLabel" defaultValue={plan.heroLabel} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <textarea name="description" defaultValue={plan.description} className="min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3" />
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">毎月の付与回数</span>
                <input
                  name="monthlyCreditGrant"
                  type="number"
                  defaultValue={plan.monthlyCreditGrant}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                  disabled={plan.unlimitedCredits}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">繰越上限</span>
                <input
                  name="rolloverCap"
                  type="number"
                  defaultValue={plan.rolloverCap}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                  disabled={plan.unlimitedCredits}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">付与ルール</span>
                <select name="cycleBasis" defaultValue={plan.cycleBasis === "calendar_month" ? "CALENDAR_MONTH" : "CONTRACT_DATE"} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <option value="CALENDAR_MONTH">毎月1日に一斉付与</option>
                  <option value="CONTRACT_DATE">会員ごとの基準日に付与</option>
                </select>
              </label>
              <SubmitButton pendingLabel="保存中...">プラン設定を保存</SubmitButton>
            </form>
          </Card>
        ))}
      </section>

      <Card>
        <div className="rounded-[24px] bg-black/[0.03] px-5 py-4 text-sm font-semibold text-slate-600">
          現在の登録会員数: {members.length} 名
        </div>
      </Card>
    </div>
  );
}
