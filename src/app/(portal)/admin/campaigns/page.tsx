import { createCampaignAction } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { listCampaigns } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

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

export default async function AdminCampaignsPage() {
  await requireAdmin();
  const campaigns = await listCampaigns();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-[var(--color-primary)]">
          配信管理
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">
          告知メールを日本語で作成
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {isEmailConfigured()
            ? "予約通知メールは送信可能です。ここでは会員向けの告知配信を下書き・予約できます。"
            : "現在は配信内容の登録のみ行えます。Resend 設定を行うとメール送信が有効になります。"}
        </p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="font-display text-2xl font-bold text-slate-950">配信内容を追加</h2>
          <form action={createCampaignAction} className="mt-5 grid gap-3">
            <input name="title" placeholder="管理用タイトル" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <input name="subject" placeholder="メール件名" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <textarea name="previewText" placeholder="プレビュー文（任意）" className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3" />
            <select name="minimumPlanCode" className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              {minimumPlanOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-500">予約配信日時（任意）</span>
              <input name="scheduledAt" type="datetime-local" className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
            <SubmitButton pendingLabel="保存中...">配信設定を保存</SubmitButton>
          </form>
        </Card>

        <div className="grid gap-5">
          {campaigns.length === 0 ? (
            <Card>
              <div className="text-sm leading-7 text-slate-500">
                まだ配信設定がありません。左のフォームから最初の告知メールを追加してください。
              </div>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Badge tone={campaign.status === "sent" ? "success" : campaign.status === "scheduled" ? "brand" : "neutral"}>
                        {statusLabelMap[campaign.status]}
                      </Badge>
                    </div>
                    <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">{campaign.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{campaign.subject}</p>
                  </div>
                  <div className="rounded-[24px] bg-black/[0.03] p-4 text-sm text-slate-600">
                    {campaign.scheduledAt ? `配信予定: ${formatDate(campaign.scheduledAt)}` : "未スケジュール"}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
