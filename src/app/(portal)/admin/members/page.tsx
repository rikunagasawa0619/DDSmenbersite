import Link from "next/link";

import { createMemberAction } from "@/actions/admin";
import { labelMemberStatus, labelPlan } from "@/lib/admin-display";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { listMembers, listMembershipPlans } from "@/lib/repository";

type MembersPageProps = {
  searchParams: Promise<{
    q?: string;
    plan?: string;
    status?: string;
    sort?: string;
    create?: string;
  }>;
};

function statusTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "invited") return "brand" as const;
  if (status === "paused" || status === "suspended") return "warning" as const;
  return "neutral" as const;
}

function NewMemberModal({
  closeHref,
  planOptions,
}: {
  closeHref: string;
  planOptions: Array<{ code: string; name: string }>;
}) {
  return (
    <Modal title="新規会員を追加" closeHref={closeHref} size="lg">
      <form action={createMemberAction} className="grid gap-4 xl:grid-cols-2">
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
            {planOptions.map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-500">自動付与の基準日</span>
          <input name="creditGrantBaseDate" type="date" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 xl:col-span-2">
          <span className="text-sm font-semibold text-slate-500">追加セグメント</span>
          <input
            name="segmentSlugs"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            placeholder="ai-foundation, sales-lab"
          />
        </label>
        <div className="xl:col-span-2 flex justify-end">
          <SubmitButton pendingLabel="追加中...">会員を追加</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

export default async function AdminMembersPage({ searchParams }: MembersPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const selectedPlan = params.plan?.toUpperCase() ?? "ALL";
  const selectedStatus = params.status?.toLowerCase() ?? "ALL";
  const sort = params.sort ?? "recent";

  const [members, plans] = await Promise.all([listMembers(), listMembershipPlans()]);

  const filteredMembers = members
    .filter((member) => {
      const matchesQuery =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.company?.toLowerCase().includes(query);
      const matchesPlan = selectedPlan === "ALL" || member.planCode === selectedPlan;
      const matchesStatus = selectedStatus === "ALL" || member.status === selectedStatus;
      return matchesQuery && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      if (sort === "plan") return a.planCode.localeCompare(b.planCode);
      if (sort === "status") return a.status.localeCompare(b.status);
      if (sort === "oldest") return a.joinedAt.localeCompare(b.joinedAt);
      return b.joinedAt.localeCompare(a.joinedAt);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
            会員管理
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold text-slate-950">会員一覧</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/exports"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            CSV 出力
          </Link>
          <Link
            href="/admin/members?create=member"
            className="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(18,56,198,0.22)] transition hover:opacity-90"
          >
            新規会員
          </Link>
        </div>
      </div>

      <Card>
        <form className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="氏名・メール・会社名で検索"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          />
          <select name="plan" defaultValue={selectedPlan} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <option value="ALL">全プラン</option>
            {plans.map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={selectedStatus} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <option value="ALL">全ステータス</option>
            <option value="active">利用中</option>
            <option value="invited">招待中</option>
            <option value="paused">休会中</option>
            <option value="withdrawn">退会済み</option>
            <option value="suspended">利用停止</option>
          </select>
          <select name="sort" defaultValue={sort} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <option value="recent">新しい順</option>
            <option value="oldest">古い順</option>
            <option value="name">氏名順</option>
            <option value="plan">プラン順</option>
            <option value="status">ステータス順</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            検索
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {!isDatabaseConfigured ? (
          <div className="p-6 text-sm text-slate-500">データベース接続後に会員管理が有効になります。</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">条件に一致する会員が見つかりませんでした。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/6">
              <thead className="bg-black/[0.03]">
                <tr className="text-left text-sm font-semibold text-slate-500">
                  <th className="px-6 py-4">メールアドレス</th>
                  <th className="px-6 py-4">名前</th>
                  <th className="px-6 py-4">プラン</th>
                  <th className="px-6 py-4">会員ステータス</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6 bg-white">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="text-sm text-slate-700">
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4 font-semibold text-slate-950">{member.name}</td>
                    <td className="px-6 py-4">{labelPlan(member.planCode)}</td>
                    <td className="px-6 py-4">
                      <Badge tone={statusTone(member.status)}>{labelMemberStatus(member.status)}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/members/${member.id}`}
                        className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        詳細表示
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {params.create === "member" ? (
        <NewMemberModal
          closeHref="/admin/members"
          planOptions={plans.map((plan) => ({ code: plan.code, name: plan.name }))}
        />
      ) : null}
    </div>
  );
}
