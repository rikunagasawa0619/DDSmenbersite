import Link from "next/link";
import { Users } from "lucide-react";

import { bulkUpdateMemberStatusAction, createMemberAction } from "@/actions/admin";
import { labelMemberStatus, labelPlan } from "@/lib/admin-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ModalTrigger } from "@/components/ui/modal-trigger";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getMemberStatusCounts, listMembersPage, listMembershipPlans } from "@/lib/repository";

type MembersPageProps = {
  searchParams: Promise<{
    q?: string;
    plan?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

function statusTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "invited") return "brand" as const;
  if (status === "paused" || status === "suspended") return "warning" as const;
  return "neutral" as const;
}

function NewMemberForm({
  planOptions,
}: {
  planOptions: Array<{ code: string; name: string }>;
}) {
  return (
    <form action={createMemberAction} className="dds-admin-form grid gap-4 xl:grid-cols-2">
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">氏名</span>
        <input name="name" className="dds-admin-input" required minLength={2} />
      </label>
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">メールアドレス</span>
        <input name="email" type="email" className="dds-admin-input" required />
      </label>
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">肩書き</span>
        <input name="title" className="dds-admin-input" required />
      </label>
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">会社名</span>
        <input name="company" className="dds-admin-input" />
      </label>
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">ロール</span>
        <select name="role" className="dds-admin-select">
          <option value="STUDENT">受講生</option>
          <option value="STAFF">運営スタッフ</option>
          <option value="SUPER_ADMIN">管理者</option>
        </select>
      </label>
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">ステータス</span>
        <select name="status" className="dds-admin-select">
          <option value="INVITED">招待中</option>
          <option value="ACTIVE">利用中</option>
          <option value="PAUSED">休会中</option>
          <option value="WITHDRAWN">退会済み</option>
          <option value="SUSPENDED">利用停止</option>
        </select>
      </label>
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">プラン</span>
        <select name="planCode" className="dds-admin-select">
          {planOptions.map((plan) => (
            <option key={plan.code} value={plan.code}>
              {plan.name}
            </option>
          ))}
        </select>
      </label>
      <label className="dds-admin-label">
        <span className="text-sm font-semibold text-slate-500">自動付与の基準日</span>
        <input name="creditGrantBaseDate" type="date" className="dds-admin-input" />
      </label>
      <label className="dds-admin-label xl:col-span-2">
        <span className="text-sm font-semibold text-slate-500">追加セグメント</span>
        <input
          name="segmentSlugs"
          className="dds-admin-input"
          placeholder="ai-foundation, sales-lab"
        />
      </label>
      <div className="xl:col-span-2 flex justify-end">
        <SubmitButton pendingLabel="追加中...">会員を追加</SubmitButton>
      </div>
    </form>
  );
}

export default async function AdminMembersPage({ searchParams }: MembersPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const selectedPlan = params.plan?.toUpperCase() ?? "ALL";
  const selectedStatus = params.status?.toLowerCase() ?? "ALL";
  const sort = params.sort ?? "recent";
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

  const [memberPage, plans, statusCounts] = await Promise.all([
    listMembersPage({
      query,
      planCode: selectedPlan as "ALL" | "HOBBY" | "BIZ" | "PRO",
      status: selectedStatus as "ALL" | "active" | "invited" | "paused" | "withdrawn" | "suspended",
      sort: sort as "recent" | "oldest" | "name" | "plan" | "status",
      page: currentPage,
      pageSize: 20,
    }),
    listMembershipPlans(),
    getMemberStatusCounts(),
  ]);

  function buildPageHref(page: number) {
    const nextParams = new URLSearchParams();
    if (params.q) nextParams.set("q", params.q);
    if (selectedPlan !== "ALL") nextParams.set("plan", selectedPlan);
    if (selectedStatus !== "ALL") nextParams.set("status", selectedStatus);
    if (sort !== "recent") nextParams.set("sort", sort);
    if (page > 1) nextParams.set("page", String(page));
    return `/admin/members${nextParams.toString() ? `?${nextParams}` : ""}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="dds-kicker text-[var(--color-primary)]">会員管理</div>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
            会員一覧
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/exports"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            CSV 出力
          </Link>
          <ModalTrigger
            title="新規会員を追加"
            size="lg"
            triggerClassName="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_rgba(18,56,198,0.22)] transition hover:opacity-90"
            triggerContent="新規会員"
          >
            <NewMemberForm planOptions={plans.map((plan) => ({ code: plan.code, name: plan.name }))} />
          </ModalTrigger>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="dds-reveal" data-delay="1">
          <div className="dds-kicker text-slate-500">利用中</div>
          <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-slate-950">{statusCounts.active}</div>
        </Card>
        <Card className="dds-reveal" data-delay="1">
          <div className="dds-kicker text-slate-500">招待中</div>
          <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-[var(--color-primary)]">{statusCounts.invited}</div>
        </Card>
        <Card className="dds-reveal" data-delay="2">
          <div className="dds-kicker text-slate-500">休会中</div>
          <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-amber-600">{statusCounts.paused}</div>
        </Card>
        <Card className="dds-reveal" data-delay="2">
          <div className="dds-kicker text-slate-500">退会済み</div>
          <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-slate-500">{statusCounts.withdrawn}</div>
        </Card>
      </section>

      <Card className="dds-reveal" data-delay="2">
        <form className="grid gap-4 xl:grid-cols-[1.6fr_0.85fr_0.85fr_0.85fr_auto]">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="氏名・メール・会社名で検索"
            className="dds-admin-input"
          />
          <select name="plan" defaultValue={selectedPlan} className="dds-admin-select">
            <option value="ALL">全プラン</option>
            {plans.map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={selectedStatus} className="dds-admin-select">
            <option value="ALL">全ステータス</option>
            <option value="active">利用中</option>
            <option value="invited">招待中</option>
            <option value="paused">休会中</option>
            <option value="withdrawn">退会済み</option>
            <option value="suspended">利用停止</option>
          </select>
          <select name="sort" defaultValue={sort} className="dds-admin-select">
            <option value="recent">新しい順</option>
            <option value="oldest">古い順</option>
            <option value="name">氏名順</option>
            <option value="plan">プラン順</option>
            <option value="status">ステータス順</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white transition hover:opacity-90"
          >
            検索
          </button>
        </form>
      </Card>

      <Card className="dds-reveal overflow-hidden p-0" data-delay="3">
        {!isDatabaseConfigured ? (
          <div className="p-6 text-sm text-slate-500">データベース接続後に会員管理が有効になります。</div>
        ) : memberPage.items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="条件に一致する会員がいません"
              description="検索条件やステータスを変えると、別の会員が見つかる可能性があります。"
              actionHref="/admin/members"
              actionLabel="条件をリセット"
            />
          </div>
        ) : (
          <form action={bulkUpdateMemberStatusAction}>
            <div className="flex flex-col gap-4 border-b border-black/6 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="dds-kicker text-slate-500">一括操作</div>
                <div className="mt-2 text-sm text-slate-600">選択した会員のステータスをまとめて変更できます。</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select name="status" className="dds-admin-select min-w-44" defaultValue="ACTIVE">
                  <option value="ACTIVE">利用中へ変更</option>
                  <option value="INVITED">招待中へ変更</option>
                  <option value="PAUSED">休会中へ変更</option>
                  <option value="WITHDRAWN">退会済みへ変更</option>
                  <option value="SUSPENDED">利用停止へ変更</option>
                </select>
                <SubmitButton
                  pendingLabel="反映中..."
                  confirmMessage="選択した会員のステータスを一括変更します。よろしいですか？"
                >
                  選択中に適用
                </SubmitButton>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="dds-admin-table min-w-full">
                <thead>
                  <tr className="text-left text-sm font-semibold text-slate-500">
                    <th className="px-6 py-4">
                      <span className="sr-only">選択</span>
                    </th>
                    <th className="px-6 py-4">メールアドレス</th>
                    <th className="px-6 py-4">名前</th>
                    <th className="px-6 py-4">プラン</th>
                    <th className="px-6 py-4">会員ステータス</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {memberPage.items.map((member) => (
                    <tr key={member.id} className="text-sm text-slate-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          name="memberIds"
                          value={member.id}
                          className="h-4 w-4 rounded border-black/20 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                          aria-label={`${member.name} を選択`}
                        />
                      </td>
                      <td className="px-6 py-4">{member.email}</td>
                      <td className="px-6 py-4 font-semibold text-slate-950">{member.name}</td>
                      <td className="px-6 py-4">{labelPlan(member.planCode)}</td>
                      <td className="px-6 py-4">
                        <Badge tone={statusTone(member.status)}>{labelMemberStatus(member.status)}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="inline-flex rounded-full border border-black/10 px-4 py-2 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          詳細表示
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </form>
        )}
      </Card>

      <PaginationNav
        currentPage={memberPage.page}
        totalPages={memberPage.totalPages}
        hrefBuilder={buildPageHref}
      />
    </div>
  );
}
