import Link from "next/link";
import { MailCheck, MailPlus, Send, ShieldAlert } from "lucide-react";

import { createCampaignAction, sendCampaignNowAction } from "@/actions/admin";
import { RichHtml } from "@/components/content/rich-html";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { getMinimumPlanCodeFromAudience, labelPlan } from "@/lib/admin-display";
import { isEmailConfigured } from "@/lib/email";
import { listCampaigns } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

type CampaignsPageProps = {
  searchParams: Promise<{
    create?: string;
  }>;
};

const minimumPlanOptions = [
  { value: "HOBBY", label: "DDS Hobby 以上" },
  { value: "BIZ", label: "DDS Biz 以上" },
  { value: "PRO", label: "DDS Pro のみ" },
];

const statusLabelMap = {
  draft: "下書き",
  scheduled: "予約済み",
  sent: "送信済み",
} as const;

const statusToneMap = {
  draft: "neutral",
  scheduled: "brand",
  sent: "success",
} as const;

function CampaignModal({ closeHref }: { closeHref: string }) {
  return (
    <Modal
      title="告知メールを作成"
      closeHref={closeHref}
      size="xl"
    >
      <form action={createCampaignAction} className="dds-admin-form grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="title" placeholder="管理用タイトル" className="dds-admin-input" />
          <input name="subject" placeholder="メール件名" className="dds-admin-input" />
        </div>
        <textarea name="previewText" placeholder="受信一覧で見える短い案内文" className="dds-admin-textarea min-h-24" />
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-500">本文</span>
          <RichTextEditor name="bodyHtml" placeholder="箇条書きや見出しを使って、読みやすい告知メールを作成します。" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select name="minimumPlanCode" className="dds-admin-select">
            {minimumPlanOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <label className="dds-admin-label">
            <span className="text-sm font-semibold text-slate-500">予約配信日時（任意）</span>
            <input name="scheduledAt" type="datetime-local" className="dds-admin-input" />
          </label>
        </div>
        <div className="flex justify-end">
          <SubmitButton pendingLabel="保存中...">配信設定を保存</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

export default async function AdminCampaignsPage({ searchParams }: CampaignsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const campaigns = await listCampaigns();
  const emailReady = isEmailConfigured();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="dds-kicker text-[var(--color-primary)]">配信管理</div>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.08em] text-slate-950">配信</h1>
        </div>
        <Link
          href="/admin/campaigns?create=campaign"
          className="inline-flex rounded-full bg-[var(--color-primary)] px-5 py-3 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_rgba(18,56,198,0.22)] transition hover:opacity-90"
        >
          新しい配信を作成
        </Link>
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className={emailReady ? "" : "border-amber-300 bg-amber-50/70"}>
          <div className="flex items-start gap-4">
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-[22px] ${emailReady ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
              {emailReady ? <MailCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-slate-950">
                {emailReady ? "メール送信は利用可能です" : "メール送信設定が未完了です"}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {emailReady
                  ? "即時送信と予約配信が使えます。"
                  : "保存はできますが、送信はまだ行われません。"}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="dds-kicker text-slate-500">下書き</div>
            <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-slate-950">
              {campaigns.filter((campaign) => campaign.status === "draft").length}
            </div>
          </Card>
          <Card>
            <div className="dds-kicker text-slate-500">予約済み</div>
            <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-[var(--color-primary)]">
              {campaigns.filter((campaign) => campaign.status === "scheduled").length}
            </div>
          </Card>
          <Card>
            <div className="dds-kicker text-slate-500">送信済み</div>
            <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.08em] text-emerald-600">
              {campaigns.filter((campaign) => campaign.status === "sent").length}
            </div>
          </Card>
        </div>
      </section>

      <div className="grid gap-5">
        {campaigns.length === 0 ? (
          <Card>
            <div className="rounded-[24px] border border-dashed border-black/10 p-6 text-sm leading-7 text-slate-500">配信はまだありません。</div>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={statusToneMap[campaign.status]}>
                      {statusLabelMap[campaign.status]}
                    </Badge>
                    <Badge tone="accent">
                      {labelPlan(getMinimumPlanCodeFromAudience(campaign.audience?.planCodes))}
                    </Badge>
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold text-slate-950">{campaign.title}</h2>
                  <div className="mt-2 text-lg font-semibold text-slate-700">{campaign.subject}</div>
                  {campaign.previewText ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{campaign.previewText}</p>
                  ) : null}
                  {campaign.bodyHtml ? (
                    <RichHtml html={campaign.bodyHtml} className="mt-5 rounded-[24px] bg-black/[0.03] p-5" />
                  ) : null}
                </div>

                <div className="grid min-w-[320px] gap-4 rounded-[28px] bg-[#10182b] p-5 text-white">
                  <div className="text-sm font-semibold text-slate-300">配信情報</div>
                  <div className="rounded-[22px] bg-white/8 p-4 text-sm text-slate-100">
                    {campaign.scheduledAt ? `配信予定: ${formatDate(campaign.scheduledAt)}` : "即時送信待ち"}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {campaign.status !== "sent" ? (
                      <form action={sendCampaignNowAction}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <SubmitButton
                          pendingLabel="送信中..."
                          className="bg-white text-[#10182b] shadow-none hover:bg-white/90"
                          disabled={!emailReady}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            今すぐ送信
                          </span>
                        </SubmitButton>
                      </form>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/18 px-4 py-2 text-sm font-semibold text-emerald-200">
                        <MailCheck className="h-4 w-4" />
                        送信完了
                      </div>
                    )}
                    <Link
                      href="/admin/campaigns?create=campaign"
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40 hover:text-white"
                    >
                      <MailPlus className="h-4 w-4" />
                      新規作成
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {params.create === "campaign" ? <CampaignModal closeHref="/admin/campaigns" /> : null}
    </div>
  );
}
