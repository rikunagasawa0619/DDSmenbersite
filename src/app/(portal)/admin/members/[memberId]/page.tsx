import Link from "next/link";
import { notFound } from "next/navigation";

import {
  adjustMemberCreditsAction,
  updateMemberPlanAction,
  updateMemberSettingsAction,
} from "@/actions/admin";
import {
  getCreditGrantDay,
  labelCycleBasis,
  labelLedgerType,
  labelMemberStatus,
  labelPlan,
  labelRole,
} from "@/lib/admin-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import {
  getMemberById,
  getMembershipPlanByCode,
  getWalletByUserId,
  listMembershipPlans,
} from "@/lib/repository";
import { formatDate, formatDateOnly } from "@/lib/utils";

type MemberDetailPageProps = {
  params: Promise<{
    memberId: string;
  }>;
};

function getGrantBaseDateValue(contractStartAt: string, creditGrantDay?: number) {
  const source = new Date(contractStartAt);
  const current = new Date();
  const year = current.getUTCFullYear();
  const month = String(current.getUTCMonth() + 1).padStart(2, "0");
  const day = String(creditGrantDay ?? source.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBadgeTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "paused" || status === "suspended") return "warning" as const;
  if (status === "invited") return "brand" as const;
  return "neutral" as const;
}

export default async function AdminMemberDetailPage({ params }: MemberDetailPageProps) {
  await requireAdmin();
  const { memberId } = await params;
  const member = await getMemberById(memberId);

  if (!member) {
    notFound();
  }

  const plan = await getMembershipPlanByCode(member.planCode);
  const [wallet, plans] = await Promise.all([
    getWalletByUserId(member.id, plan, member.contractStartAt, member.creditGrantDay),
    listMembershipPlans(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/admin/members"
            className="text-sm font-semibold text-[var(--color-primary)]"
          >
            会員一覧へ戻る
          </Link>
          <h1 className="mt-2 font-display text-4xl font-bold text-slate-950">{member.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge tone="brand">{labelRole(member.role)}</Badge>
            <Badge tone="accent">{labelPlan(member.planCode)}</Badge>
            <Badge tone={getBadgeTone(member.status)}>{labelMemberStatus(member.status)}</Badge>
          </div>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <div className="grid gap-4 text-sm text-slate-600">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">メールアドレス</div>
              <div className="mt-1 text-base font-semibold text-slate-950">{member.email}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">所属</div>
              <div className="mt-1">{member.company || "未設定"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">肩書き</div>
              <div className="mt-1">{member.title}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">登録日</div>
              <div className="mt-1">{formatDateOnly(member.joinedAt)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">契約開始日</div>
              <div className="mt-1">{formatDateOnly(member.contractStartAt)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">自動付与の基準日</div>
              <div className="mt-1">{getCreditGrantDay(member.contractStartAt, member.creditGrantDay)}日</div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#10182b] text-white">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] bg-white/8 p-4">
              <div className="text-xs tracking-[0.18em] text-white/45">残クレジット</div>
              <div className="mt-2 text-3xl font-bold">{plan.unlimitedCredits ? "∞" : wallet.currentBalance}</div>
            </div>
            <div className="rounded-[22px] bg-white/8 p-4">
              <div className="text-xs tracking-[0.18em] text-white/45">次回付与日</div>
              <div className="mt-2 text-lg font-bold">
                {plan.unlimitedCredits ? "無制限" : formatDateOnly(wallet.nextGrantAt)}
              </div>
            </div>
            <div className="rounded-[22px] bg-white/8 p-4">
              <div className="text-xs tracking-[0.18em] text-white/45">付与ルール</div>
              <div className="mt-2 text-lg font-bold">{labelCycleBasis(plan.cycleBasis)}</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <div className="font-display text-2xl font-bold text-slate-950">会員設定</div>
          <form action={updateMemberSettingsAction} className="mt-5 grid gap-3">
            <input type="hidden" name="userId" value={member.id} />
            <input name="name" defaultValue={member.name} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="title" defaultValue={member.title} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="company" defaultValue={member.company} placeholder="会社名" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <select name="role" defaultValue={member.role.toUpperCase()} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="STUDENT">受講生</option>
              <option value="STAFF">運営スタッフ</option>
              <option value="SUPER_ADMIN">管理者</option>
            </select>
            <select name="status" defaultValue={member.status.toUpperCase()} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="ACTIVE">利用中</option>
              <option value="INVITED">招待中</option>
              <option value="PAUSED">休会中</option>
              <option value="WITHDRAWN">退会済み</option>
              <option value="SUSPENDED">利用停止</option>
            </select>
            <input
              name="creditGrantBaseDate"
              type="date"
              defaultValue={getGrantBaseDateValue(member.contractStartAt, member.creditGrantDay)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            />
            <SubmitButton pendingLabel="更新中...">保存</SubmitButton>
          </form>
        </Card>

        <Card>
          <div className="font-display text-2xl font-bold text-slate-950">プラン変更</div>
          <form action={updateMemberPlanAction} className="mt-5 grid gap-3">
            <input type="hidden" name="userId" value={member.id} />
            <select name="planCode" defaultValue={plan.code} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {plans.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            <SubmitButton pendingLabel="更新中...">プランを更新</SubmitButton>
          </form>
        </Card>

        <Card>
          <div className="font-display text-2xl font-bold text-slate-950">クレジット調整</div>
          <form action={adjustMemberCreditsAction} className="mt-5 grid gap-3">
            <input type="hidden" name="userId" value={member.id} />
            <select name="mode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="bonus">手動付与</option>
              <option value="adjustment">残高補正</option>
            </select>
            <input name="amount" type="number" placeholder="例: 4 / -2" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <textarea name="note" placeholder="理由" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <SubmitButton pendingLabel="反映中...">反映</SubmitButton>
          </form>
        </Card>
      </section>

      <Card>
        <div className="font-display text-2xl font-bold text-slate-950">クレジット履歴</div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-black/6">
            <thead className="bg-black/[0.03]">
              <tr className="text-left text-sm font-semibold text-slate-500">
                <th className="px-4 py-3">日時</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">増減</th>
                <th className="px-4 py-3">内容</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 bg-white text-sm text-slate-700">
              {wallet.ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    履歴はまだありません。
                  </td>
                </tr>
              ) : (
                wallet.ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">{formatDate(entry.createdAt)}</td>
                    <td className="px-4 py-3">{labelLedgerType(entry.type)}</td>
                    <td className={`px-4 py-3 font-semibold ${entry.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                    </td>
                    <td className="px-4 py-3">{entry.note}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
