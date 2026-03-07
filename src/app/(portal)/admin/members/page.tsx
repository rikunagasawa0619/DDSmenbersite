import Link from "next/link";

import {
  adjustMemberCreditsAction,
  createMemberAction,
  updateMemberPlanAction,
  updateMemberSettingsAction,
} from "@/actions/admin";
import {
  getCreditGrantDay,
  labelCycleBasis,
  labelMemberStatus,
  labelPlan,
  labelRole,
} from "@/lib/admin-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import {
  getMembershipPlanByCode,
  getWalletByUserId,
  listMembers,
  listMembershipPlans,
} from "@/lib/repository";
import { formatDateOnly } from "@/lib/utils";

type MembersPageProps = {
  searchParams: Promise<{
    q?: string;
    plan?: string;
    status?: string;
    role?: string;
    sort?: string;
  }>;
};

function getBadgeTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "paused" || status === "suspended") return "warning" as const;
  if (status === "invited") return "brand" as const;
  return "neutral" as const;
}

function getGrantBaseDateValue(contractStartAt: string, creditGrantDay?: number) {
  const source = new Date(contractStartAt);
  const current = new Date();
  const year = current.getUTCFullYear();
  const month = String(current.getUTCMonth() + 1).padStart(2, "0");
  const day = String(creditGrantDay ?? source.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AdminMembersPage({
  searchParams,
}: MembersPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const selectedPlan = params.plan?.toUpperCase() ?? "ALL";
  const selectedStatus = params.status?.toLowerCase() ?? "ALL";
  const selectedRole = params.role?.toLowerCase() ?? "ALL";
  const sort = params.sort ?? "recent";

  const members = await listMembers();
  const plans = await listMembershipPlans();
  const memberRows = await Promise.all(
    members.map(async (member) => {
      const plan = await getMembershipPlanByCode(member.planCode);
      const wallet = await getWalletByUserId(
        member.id,
        plan,
        member.contractStartAt,
        member.creditGrantDay,
      );
      return { member, plan, wallet };
    }),
  );

  const filteredRows = memberRows
    .filter(({ member }) => {
      const matchesQuery =
        query.length === 0 ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.company?.toLowerCase().includes(query) ||
        member.segmentSlugs.some((segment) => segment.toLowerCase().includes(query));
      const matchesPlan = selectedPlan === "ALL" || member.planCode === selectedPlan;
      const matchesStatus = selectedStatus === "ALL" || member.status === selectedStatus;
      const matchesRole = selectedRole === "ALL" || member.role === selectedRole;
      return matchesQuery && matchesPlan && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      if (sort === "name") {
        return a.member.name.localeCompare(b.member.name, "ja");
      }
      if (sort === "credits") {
        return b.wallet.currentBalance - a.wallet.currentBalance;
      }
      if (sort === "nextGrant") {
        return a.wallet.nextGrantAt.localeCompare(b.wallet.nextGrantAt);
      }
      if (sort === "oldest") {
        return a.member.joinedAt.localeCompare(b.member.joinedAt);
      }
      return b.member.joinedAt.localeCompare(a.member.joinedAt);
    });

  const stats = {
    total: memberRows.length,
    active: memberRows.filter(({ member }) => member.status === "active").length,
    paused: memberRows.filter(({ member }) => member.status === "paused").length,
    withdrawn: memberRows.filter(({ member }) => member.status === "withdrawn").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
            会員管理
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">
            検索しながら会員設定を更新
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            会員検索、プラン変更、ロール変更、ステータス変更、クレジット補正、毎月の自動付与基準日の変更をこの画面でまとめて行えます。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/exports"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            CSV 出力
          </Link>
          <Link
            href="/admin/audit-logs"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            監査ログ
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm font-semibold text-slate-500">総会員数</div>
          <div className="mt-3 font-display text-4xl font-bold text-slate-950">{stats.total}</div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-slate-500">利用中</div>
          <div className="mt-3 font-display text-4xl font-bold text-emerald-600">{stats.active}</div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-slate-500">休会中</div>
          <div className="mt-3 font-display text-4xl font-bold text-amber-600">{stats.paused}</div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-slate-500">退会済み</div>
          <div className="mt-3 font-display text-4xl font-bold text-slate-500">{stats.withdrawn}</div>
        </Card>
      </section>

      <Card>
        <form className="grid gap-4 xl:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">会員検索</span>
            <input
              name="q"
              defaultValue={params.q}
              placeholder="氏名・メール・会社名・セグメント"
              className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">プラン</span>
            <select name="plan" defaultValue={selectedPlan} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="ALL">すべて</option>
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">ステータス</span>
            <select name="status" defaultValue={selectedStatus} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="ALL">すべて</option>
              <option value="active">利用中</option>
              <option value="invited">招待中</option>
              <option value="paused">休会中</option>
              <option value="withdrawn">退会済み</option>
              <option value="suspended">利用停止</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">ロール</span>
            <select name="role" defaultValue={selectedRole} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="ALL">すべて</option>
              <option value="student">受講生</option>
              <option value="staff">運営スタッフ</option>
              <option value="super_admin">管理者</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-500">並び順</span>
            <select name="sort" defaultValue={sort} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <option value="recent">登録が新しい順</option>
              <option value="oldest">登録が古い順</option>
              <option value="name">氏名順</option>
              <option value="credits">残クレジット順</option>
              <option value="nextGrant">次回付与日順</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(18,56,198,0.22)] transition hover:opacity-90"
            >
              絞り込む
            </button>
          </div>
        </form>
      </Card>

      <Card>
        {isDatabaseConfigured ? (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-950">新規会員を追加</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                招待メール送信、プラン設定、会員ステータス、毎月のクレジット付与基準日の初期設定をまとめて行えます。
              </p>
            </div>
            <form action={createMemberAction} className="grid gap-4 xl:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">氏名</span>
                <input name="name" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">メールアドレス</span>
                <input name="email" type="email" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">肩書き</span>
                <input name="title" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">会社名</span>
                <input name="company" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">ロール</span>
                <select name="role" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <option value="STUDENT">受講生</option>
                  <option value="STAFF">運営スタッフ</option>
                  <option value="SUPER_ADMIN">管理者</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">ステータス</span>
                <select name="status" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <option value="INVITED">招待中</option>
                  <option value="ACTIVE">利用中</option>
                  <option value="PAUSED">休会中</option>
                  <option value="WITHDRAWN">退会済み</option>
                  <option value="SUSPENDED">利用停止</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">プラン</span>
                <select name="planCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  {plans.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-500">自動付与の基準日</span>
                <input
                  name="creditGrantBaseDate"
                  type="date"
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                />
              </label>
              <label className="grid gap-2 xl:col-span-2">
                <span className="text-sm font-semibold text-slate-500">追加セグメント</span>
                <input
                  name="segmentSlugs"
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                  placeholder="ai-foundation, sales-lab"
                />
              </label>
              <div className="xl:col-span-3">
                <SubmitButton pendingLabel="追加中...">会員を追加</SubmitButton>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm leading-7 text-slate-500">
            データベース接続後に会員追加と招待送信が有効になります。
          </div>
        )}
      </Card>

      <div className="grid gap-5">
        {filteredRows.length === 0 ? (
          <Card>
            <div className="text-sm leading-7 text-slate-500">
              条件に一致する会員が見つかりませんでした。検索語やフィルターを調整してください。
            </div>
          </Card>
        ) : (
          filteredRows.map(({ member, plan, wallet }) => (
            <Card key={member.id} className="overflow-hidden">
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-2xl font-bold text-slate-950">{member.name}</h2>
                        <Badge tone="brand">{labelRole(member.role)}</Badge>
                        <Badge tone="accent">{plan.name}</Badge>
                        <Badge tone={getBadgeTone(member.status)}>{labelMemberStatus(member.status)}</Badge>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">{member.email}</div>
                      <div className="mt-2 text-sm text-slate-500">
                        {member.company ? `${member.company} / ` : ""}
                        {member.title}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        セグメント: {member.segmentSlugs.length > 0 ? member.segmentSlugs.join(", ") : "なし"}
                      </div>
                    </div>
                    <div className="grid min-w-[300px] gap-2 rounded-[24px] border border-black/6 bg-black/[0.03] p-4 text-sm text-slate-600">
                      <div>登録日: {formatDateOnly(member.joinedAt)}</div>
                      <div>契約開始日: {formatDateOnly(member.contractStartAt)}</div>
                      <div>残クレジット: {plan.unlimitedCredits ? "無制限" : `${wallet.currentBalance} 回`}</div>
                      <div>次回自動付与: {plan.unlimitedCredits ? "無制限プラン" : formatDateOnly(wallet.nextGrantAt)}</div>
                      <div>付与ルール: {labelCycleBasis(plan.cycleBasis)}</div>
                      <div>毎月の付与日: {plan.unlimitedCredits ? "対象外" : `${getCreditGrantDay(member.contractStartAt, member.creditGrantDay)}日`}</div>
                    </div>
                  </div>

                  {isDatabaseConfigured ? (
                    <div className="grid gap-4 xl:grid-cols-3">
                      <form action={updateMemberSettingsAction} className="grid gap-3 rounded-[24px] border border-black/6 p-4">
                        <input type="hidden" name="userId" value={member.id} />
                        <div className="text-sm font-semibold text-slate-500">会員情報と自動付与設定</div>
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
                        <label className="grid gap-2">
                          <span className="text-xs font-semibold tracking-[0.12em] text-slate-500">自動付与の基準日</span>
                          <input
                            name="creditGrantBaseDate"
                            type="date"
                            defaultValue={getGrantBaseDateValue(member.contractStartAt, member.creditGrantDay)}
                            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                          />
                        </label>
                        <SubmitButton pendingLabel="更新中...">会員設定を保存</SubmitButton>
                      </form>

                      <form action={updateMemberPlanAction} className="grid gap-3 rounded-[24px] border border-black/6 p-4">
                        <input type="hidden" name="userId" value={member.id} />
                        <div className="text-sm font-semibold text-slate-500">プラン変更</div>
                        <select name="planCode" defaultValue={plan.code} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                          {plans.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3 text-sm leading-7 text-slate-600">
                          選択したプランへ即時切替します。DDS Pro は予約・教材とも無制限扱いです。
                        </div>
                        <SubmitButton pendingLabel="更新中...">プランを更新</SubmitButton>
                      </form>

                      <form action={adjustMemberCreditsAction} className="grid gap-3 rounded-[24px] border border-black/6 p-4">
                        <input type="hidden" name="userId" value={member.id} />
                        <div className="text-sm font-semibold text-slate-500">クレジット手動調整</div>
                        <select name="mode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                          <option value="bonus">手動付与</option>
                          <option value="adjustment">残高補正</option>
                        </select>
                        <input
                          name="amount"
                          type="number"
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                          placeholder="例: 4 / -2"
                        />
                        <textarea
                          name="note"
                          className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3"
                          placeholder="運営メモや補正理由を入力"
                        />
                        <SubmitButton pendingLabel="反映中...">クレジットを反映</SubmitButton>
                      </form>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[28px] bg-[#10182b] p-5 text-white">
                  <div className="text-sm font-semibold text-white/60">現在の契約状況</div>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-[22px] bg-white/8 p-4">
                      <div className="text-xs tracking-[0.18em] text-white/45">プラン</div>
                      <div className="mt-2 text-xl font-bold">{labelPlan(member.planCode)}</div>
                    </div>
                    <div className="rounded-[22px] bg-white/8 p-4">
                      <div className="text-xs tracking-[0.18em] text-white/45">ロール</div>
                      <div className="mt-2 text-xl font-bold">{labelRole(member.role)}</div>
                    </div>
                    <div className="rounded-[22px] bg-white/8 p-4">
                      <div className="text-xs tracking-[0.18em] text-white/45">会員ステータス</div>
                      <div className="mt-2 text-xl font-bold">{labelMemberStatus(member.status)}</div>
                    </div>
                    <div className="rounded-[22px] bg-white/8 p-4 text-sm leading-7 text-white/75">
                      休会中・退会済み・利用停止の会員には月次クレジットは自動付与されません。
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
