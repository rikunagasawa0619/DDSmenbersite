import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { listCampaigns } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

export default async function AdminCampaignsPage() {
  await requireAdmin();
  const campaigns = await listCampaigns();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Campaigns
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950">メール配信</h1>
        <p className="mt-3 text-sm text-slate-600">
          {isEmailConfigured()
            ? "予約確認・キャンセル通知のメール送信が有効です。"
            : "RESEND_API_KEY と RESEND_FROM_EMAIL を設定すると予約通知メールを送信できます。"}
        </p>
      </div>

      <div className="grid gap-5">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-500">{campaign.status}</div>
                <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">{campaign.title}</h2>
                <p className="mt-3 text-sm text-slate-600">{campaign.subject}</p>
              </div>
              <div className="rounded-[24px] bg-black/[0.03] p-4 text-sm text-slate-600">
                {campaign.scheduledAt ? `配信予定: ${formatDate(campaign.scheduledAt)}` : "未スケジュール"}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
