import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, BadgeCheck, CalendarClock, CreditCard, History, Layers3, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";

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
  labelReservationStatus,
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
  listAuditLogs,
  listMembershipPlans,
  listOfferings,
  listReservations,
  listWaitlistEntries,
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

function getStatusTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "paused" || status === "suspended") return "warning" as const;
  if (status === "invited") return "brand" as const;
  return "neutral" as const;
}

function getReservationTone(status: string) {
  if (status === "confirmed" || status === "attended") return "success" as const;
  if (status === "waitlisted") return "warning" as const;
  if (status === "cancelled") return "neutral" as const;
  return "warning" as const;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <div className="dds-kicker text-slate-400">{label}</div>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  );
}

function DetailStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "brand" | "accent";
}) {
  return (
    <div
      className={
        tone === "brand"
          ? "rounded-[26px] border border-[rgba(45,91,255,0.12)] bg-[rgba(45,91,255,0.08)] p-5"
          : tone === "accent"
            ? "rounded-[26px] border border-[rgba(215,255,100,0.28)] bg-[rgba(215,255,100,0.18)] p-5"
            : "rounded-[26px] border border-black/8 bg-white/68 p-5"
      }
    >
      <div className="dds-kicker text-slate-500">{label}</div>
      <div className="mt-4 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
        {value}
      </div>
    </div>
  );
}

export default async function AdminMemberDetailPage({ params }: MemberDetailPageProps) {
  await requireAdmin();
  const { memberId } = await params;
  const member = await getMemberById(memberId);

  if (!member) {
    notFound();
  }

  const plan = await getMembershipPlanByCode(member.planCode);
  const [wallet, plans, reservations, waitlistEntries, offerings, auditLogs] = await Promise.all([
    getWalletByUserId(member.id, plan, member.contractStartAt, member.creditGrantDay),
    listMembershipPlans(),
    listReservations(member.id),
    listWaitlistEntries(),
    listOfferings(),
    listAuditLogs(200),
  ]);

  const waitlistForMember = waitlistEntries.filter((entry) => entry.userId === member.id).slice(0, 6);
  const offeringMap = new Map(offerings.map((offering) => [offering.id, offering]));
  const relatedLogs = auditLogs
    .filter((entry) => entry.targetId === member.id || entry.userId === member.id)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="relative overflow-hidden bg-[linear-gradient(135deg,#eef3ff,#dfe8ff_52%,#f5efe3)] text-slate-950">
          <div className="absolute left-[-30px] top-10 h-40 w-40 rounded-full bg-[rgba(45,91,255,0.28)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[rgba(215,255,100,0.14)] blur-3xl" />
          <div className="relative">
            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-600 transition hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              会員一覧へ戻る
            </Link>
            <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-black/8 bg-white/76 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
                {member.avatarLabel}
              </div>
              <div className="flex-1">
                <div className="dds-kicker text-[var(--color-brand)]">会員プロフィール</div>
                <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950 md:text-5xl">
                  {member.name}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Badge tone="brand">{labelRole(member.role)}</Badge>
                  <Badge tone="accent">{labelPlan(member.planCode)}</Badge>
                  <Badge tone={getStatusTone(member.status)}>{labelMemberStatus(member.status)}</Badge>
                </div>
                <div className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <div className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[var(--color-primary)]" />
                    {member.email}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                    登録日 {formatDateOnly(member.joinedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[linear-gradient(180deg,#e9e2d3,#f5efe2)]">
          <div className="dds-kicker text-[var(--color-primary)]">契約とクレジット</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DetailStat
              label="残クレジット"
              value={plan.unlimitedCredits ? "∞" : wallet.currentBalance}
              tone="brand"
            />
            <DetailStat
              label="次回付与日"
              value={plan.unlimitedCredits ? "無制限" : formatDateOnly(wallet.nextGrantAt)}
              tone="accent"
            />
            <DetailStat label="今周期の付与" value={wallet.thisCycleGranted} />
            <DetailStat label="今周期の消費" value={wallet.thisCycleConsumed} />
          </div>
          <div className="mt-5 grid gap-3 rounded-[28px] border border-black/8 bg-white/60 p-5 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-4">
              <span>付与ルール</span>
              <span className="font-semibold text-slate-950">{labelCycleBasis(plan.cycleBasis)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>繰越</span>
              <span className="font-semibold text-slate-950">{plan.unlimitedCredits ? "制限なし" : `${wallet.carriedOver} 回`}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>自動付与の基準日</span>
              <span className="font-semibold text-slate-950">{getCreditGrantDay(member.contractStartAt, member.creditGrantDay)}日</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <div className="dds-kicker text-slate-500">基本情報</div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                会員の状態
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InfoRow label="メールアドレス" value={member.email} />
            <InfoRow label="所属" value={member.company || "未設定"} />
            <InfoRow label="肩書き" value={member.title || "未設定"} />
            <InfoRow label="契約開始日" value={formatDateOnly(member.contractStartAt)} />
            <InfoRow label="現在プラン" value={labelPlan(member.planCode)} />
            <InfoRow label="ロール" value={labelRole(member.role)} />
          </div>
          <div className="mt-6">
            <div className="dds-kicker text-slate-400">セグメント</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {member.segmentSlugs.length === 0 ? (
                <span className="text-sm text-slate-500">追加セグメントはありません。</span>
              ) : (
                member.segmentSlugs.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex rounded-full border border-black/8 bg-white px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700"
                  >
                    {slug}
                  </span>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-[linear-gradient(180deg,#edf3ff,#f5efe2)] text-slate-950">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.08)] text-[var(--color-primary)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="dds-kicker text-slate-500">運用サマリー</div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                行動履歴
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-black/8 bg-white/72 p-4">
              <div className="dds-kicker text-slate-500">予約数</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
                {reservations.length}
              </div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-white/72 p-4">
              <div className="dds-kicker text-slate-500">待機数</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
                {waitlistForMember.length}
              </div>
            </div>
            <div className="rounded-[24px] border border-black/8 bg-white/72 p-4">
              <div className="dds-kicker text-slate-500">操作履歴</div>
              <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">
                {relatedLogs.length}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <div className="dds-kicker text-slate-500">会員設定</div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                基本設定を更新
              </div>
            </div>
          </div>
          <form action={updateMemberSettingsAction} className="dds-admin-form mt-6 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="userId" value={member.id} />
            <label className="dds-admin-label">
              <span>氏名</span>
              <input name="name" defaultValue={member.name} className="dds-admin-input" required minLength={2} />
            </label>
            <label className="dds-admin-label">
              <span>肩書き</span>
              <input name="title" defaultValue={member.title} className="dds-admin-input" required minLength={1} />
            </label>
            <label className="dds-admin-label">
              <span>会社名</span>
              <input name="company" defaultValue={member.company} placeholder="会社名" className="dds-admin-input" />
            </label>
            <label className="dds-admin-label">
              <span>自動付与の基準日</span>
              <input
                name="creditGrantBaseDate"
                type="date"
                defaultValue={getGrantBaseDateValue(member.contractStartAt, member.creditGrantDay)}
                className="dds-admin-input"
              />
            </label>
            <label className="dds-admin-label">
              <span>ロール</span>
              <select name="role" defaultValue={member.role.toUpperCase()} className="dds-admin-select">
                <option value="STUDENT">受講生</option>
                <option value="STAFF">運営スタッフ</option>
                <option value="SUPER_ADMIN">管理者</option>
              </select>
            </label>
            <label className="dds-admin-label">
              <span>会員ステータス</span>
              <select name="status" defaultValue={member.status.toUpperCase()} className="dds-admin-select">
                <option value="ACTIVE">利用中</option>
                <option value="INVITED">招待中</option>
                <option value="PAUSED">休会中</option>
                <option value="WITHDRAWN">退会済み</option>
                <option value="SUSPENDED">利用停止</option>
              </select>
            </label>
            <div className="md:col-span-2 flex justify-end">
              <SubmitButton
                pendingLabel="更新中..."
                confirmMessage="会員の基本設定を更新します。ステータス変更を含む場合は会員導線に影響します。"
              >
                基本設定を保存
              </SubmitButton>
            </div>
          </form>
        </Card>

        <div className="grid gap-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="dds-kicker text-slate-500">契約設定</div>
                <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                  プラン変更
                </div>
              </div>
            </div>
            <form action={updateMemberPlanAction} className="dds-admin-form mt-6 grid gap-4">
              <input type="hidden" name="userId" value={member.id} />
              <label className="dds-admin-label">
                <span>現在のプラン</span>
                <select name="planCode" defaultValue={plan.code} className="dds-admin-select">
                  {plans.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-[22px] border border-black/8 bg-black/[0.03] px-4 py-4 text-sm text-slate-600">
                {plan.unlimitedCredits
                  ? "Pro はクレジット無制限です。"
                  : `月 ${plan.monthlyCreditGrant} 回付与 / 繰越上限 ${plan.rolloverCap} 回`}
              </div>
              <div className="flex justify-end">
                <SubmitButton
                  pendingLabel="更新中..."
                  confirmMessage="プランを変更します。クレジット残高と閲覧権限が再計算される場合があります。"
                >
                  プランを更新
                </SubmitButton>
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="dds-kicker text-slate-500">クレジット調整</div>
                <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                  手動付与と補正
                </div>
              </div>
            </div>
            <form action={adjustMemberCreditsAction} className="dds-admin-form mt-6 grid gap-4">
              <input type="hidden" name="userId" value={member.id} />
              <label className="dds-admin-label">
                <span>操作内容</span>
                <select name="mode" className="dds-admin-select">
                  <option value="bonus">手動付与</option>
                  <option value="adjustment">残高補正</option>
                </select>
              </label>
              <label className="dds-admin-label">
                <span>増減数</span>
                <input name="amount" type="number" placeholder="例: 4 / -2" className="dds-admin-input" required />
              </label>
              <label className="dds-admin-label">
                <span>理由</span>
                <textarea name="note" placeholder="理由を記録" className="dds-admin-textarea min-h-24" required minLength={2} />
              </label>
              <div className="flex justify-end">
                <SubmitButton
                  pendingLabel="反映中..."
                  confirmMessage="クレジット残高を調整します。台帳にも記録されます。"
                >
                  クレジットを反映
                </SubmitButton>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <div className="dds-kicker text-slate-500">予約状況</div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                最近の予約と待機
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {reservations.length === 0 && waitlistForMember.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
                予約と待機はまだありません。
              </div>
            ) : (
              <>
                {reservations.slice(0, 6).map((reservation) => {
                  const offering = offeringMap.get(reservation.offeringId);
                  return (
                    <div key={reservation.id} className="rounded-[26px] border border-black/8 bg-white/72 p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone={getReservationTone(reservation.status)}>
                          {labelReservationStatus(reservation.status)}
                        </Badge>
                        <span className="text-xs text-slate-500">{formatDate(reservation.createdAt)}</span>
                      </div>
                      <div className="mt-3 font-semibold text-slate-950">
                        {offering?.title ?? "募集枠は削除または未取得"}
                      </div>
                      {offering ? (
                        <div className="mt-2 text-sm text-slate-600">
                          {formatDate(offering.startsAt)} / {offering.locationLabel}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {waitlistForMember.map((entry) => {
                  const offering = offeringMap.get(entry.offeringId);
                  return (
                    <div key={entry.id} className="rounded-[26px] border border-black/8 bg-black/[0.03] p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone="warning">待機中</Badge>
                        <span className="text-xs text-slate-500">{formatDate(entry.createdAt)}</span>
                      </div>
                      <div className="mt-3 font-semibold text-slate-950">
                        {offering?.title ?? "募集枠は削除または未取得"}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="dds-kicker text-slate-500">監査ログ</div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
                最近の操作
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {relatedLogs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 p-5 text-sm text-slate-500">
                関連する操作履歴はまだありません。
              </div>
            ) : (
              relatedLogs.map((entry) => (
                <div key={entry.id} className="rounded-[24px] border border-black/8 bg-white/72 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold text-slate-950">{entry.action}</div>
                    <div className="text-xs text-slate-500">{formatDate(entry.createdAt)}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {entry.actorName} / {entry.actorEmail}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgba(45,91,255,0.1)] text-[var(--color-primary)]">
            <History className="h-5 w-5" />
          </div>
          <div>
            <div className="dds-kicker text-slate-500">クレジット台帳</div>
            <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.08em] text-slate-950">
              クレジット履歴
            </div>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="dds-admin-table min-w-full">
            <thead>
              <tr>
                <th>日時</th>
                <th>種別</th>
                <th>増減</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {wallet.ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    履歴はまだありません。
                  </td>
                </tr>
              ) : (
                wallet.ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>{labelLedgerType(entry.type)}</td>
                    <td className={entry.amount >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                      {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                    </td>
                    <td>{entry.note}</td>
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
