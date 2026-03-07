import Link from "next/link";

import { adjustMemberCreditsAction, createMemberAction, updateMemberPlanAction } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getMembershipPlanByCode, getWalletByUserId, listMembers, listMembershipPlans } from "@/lib/repository";

export default async function AdminMembersPage() {
  await requireAdmin();
  const members = await listMembers();
  const plans = await listMembershipPlans();
  const memberRows = await Promise.all(
    members.map(async (member) => {
      const plan = await getMembershipPlanByCode(member.planCode);
      const wallet = await getWalletByUserId(member.id, plan, member.contractStartAt);
      return { member, plan, wallet };
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Members
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">会員管理</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/exports"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            CSV 出力へ
          </Link>
          <Link
            href="/admin/audit-logs"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            監査ログを見る
          </Link>
        </div>
      </div>

      <Card>
        {isDatabaseConfigured ? (
          <form action={createMemberAction} className="grid gap-4 xl:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">氏名</span>
              <input name="name" className="rounded-2xl border border-black/10 px-4 py-3" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">メールアドレス</span>
              <input name="email" type="email" className="rounded-2xl border border-black/10 px-4 py-3" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">肩書き</span>
              <input name="title" className="rounded-2xl border border-black/10 px-4 py-3" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">ロール</span>
              <select name="role" className="rounded-2xl border border-black/10 px-4 py-3">
                <option value="STUDENT">STUDENT</option>
                <option value="STAFF">STAFF</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">プラン</span>
              <select name="planCode" className="rounded-2xl border border-black/10 px-4 py-3">
                {plans.map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">ステータス</span>
              <select name="status" className="rounded-2xl border border-black/10 px-4 py-3">
                <option value="INVITED">INVITED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </label>
            <label className="grid gap-2 xl:col-span-2">
              <span className="text-sm font-semibold text-slate-500">追加セグメント（カンマ区切り）</span>
              <input
                name="segmentSlugs"
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder="ai-foundation, sales-lab"
              />
            </label>
            <div className="xl:col-span-2">
              <SubmitButton pendingLabel="追加中...">会員を追加</SubmitButton>
            </div>
          </form>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-black/6 p-5">
              <div className="font-display text-xl font-bold text-slate-950">個別招待 / CSV取込</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                `DATABASE_URL` を設定すると、管理画面から会員を追加し永続化できます。
              </p>
            </div>
            <div className="rounded-[24px] border border-black/6 p-5">
              <div className="font-display text-xl font-bold text-slate-950">プラン切替ルール</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                契約切替日から即時反映。`Pro → Biz/Hobby` は新プラン仕様の基本枠を即時付与して移行します。
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4">
        {memberRows.map(({ member, plan, wallet }) => (
          <Card key={member.id}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-display text-2xl font-bold text-slate-950">{member.name}</div>
                    <Badge tone="brand">{member.role}</Badge>
                    <Badge tone="accent">{plan.name}</Badge>
                    <Badge tone="neutral">{member.status}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">{member.email}</div>
                  <div className="mt-2 text-sm text-slate-500">
                    セグメント: {member.segmentSlugs.join(", ")}
                  </div>
                </div>
                <div className="grid min-w-[280px] gap-2 rounded-[24px] bg-black/[0.03] p-4 text-sm text-slate-600">
                  <div>契約開始: {member.contractStartAt.slice(0, 10)}</div>
                  <div>残クレジット: {plan.unlimitedCredits ? "無制限" : wallet.currentBalance}</div>
                  <div>付与方式: {plan.cycleBasis === "calendar_month" ? "毎月1日" : "契約日基準"}</div>
                </div>
              </div>

              {isDatabaseConfigured ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <form action={updateMemberPlanAction} className="grid gap-3 rounded-[24px] border border-black/6 p-4">
                    <input type="hidden" name="userId" value={member.id} />
                    <div className="text-sm font-semibold text-slate-500">プラン変更</div>
                    <select name="planCode" defaultValue={plan.code} className="rounded-2xl border border-black/10 px-4 py-3">
                      {plans.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <SubmitButton pendingLabel="更新中...">プランを更新</SubmitButton>
                  </form>

                  <form action={adjustMemberCreditsAction} className="grid gap-3 rounded-[24px] border border-black/6 p-4">
                    <input type="hidden" name="userId" value={member.id} />
                    <div className="text-sm font-semibold text-slate-500">クレジット付与 / 補正</div>
                    <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                      <select name="mode" className="rounded-2xl border border-black/10 px-4 py-3">
                        <option value="bonus">bonus grant</option>
                        <option value="adjustment">balance adjustment</option>
                      </select>
                      <input
                        name="amount"
                        type="number"
                        className="rounded-2xl border border-black/10 px-4 py-3"
                        placeholder="4 or -2"
                      />
                    </div>
                    <input
                      name="note"
                      className="rounded-2xl border border-black/10 px-4 py-3"
                      placeholder="理由を入力"
                    />
                    <SubmitButton pendingLabel="反映中...">クレジットを反映</SubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
