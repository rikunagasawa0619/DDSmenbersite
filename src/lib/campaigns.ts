import { EmailCampaignStatus, MembershipPlanCode, MemberStatus } from "@prisma/client";

import { sendEmail, isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sanitizeRichHtml } from "@/lib/rich-content";

function formatAudienceLabel(planCodes?: MembershipPlanCode[]) {
  if (!planCodes || planCodes.length === 0) {
    return "すべての会員";
  }

  const ordered = ["HOBBY", "BIZ", "PRO"].filter((code) => planCodes.includes(code as MembershipPlanCode));
  return ordered.map((code) => `DDS ${code === "HOBBY" ? "Hobby" : code === "BIZ" ? "Biz" : "Pro"}`).join(" / ");
}

function buildCampaignEmailHtml(params: {
  title: string;
  previewText?: string | null;
  bodyHtml?: string | null;
  audienceLabel: string;
}) {
  const body = params.bodyHtml
    ? sanitizeRichHtml(params.bodyHtml)
    : `<p>${params.previewText ?? "新しいお知らせがあります。"}</p>`;

  return `
    <div style="font-family:Arial,sans-serif;background:#f7f5ef;padding:32px;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:28px;padding:36px;">
        <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1238c6;font-weight:700;">DDS MEMBERS</div>
        <h1 style="margin:18px 0 0;font-size:28px;line-height:1.3;">${params.title}</h1>
        ${params.previewText ? `<p style="margin-top:14px;color:#64748b;font-size:15px;line-height:1.8;">${params.previewText}</p>` : ""}
        <div style="margin-top:28px;font-size:15px;line-height:1.9;color:#334155;">${body}</div>
        <div style="margin-top:28px;padding:18px 20px;border-radius:20px;background:#f8fafc;color:#475569;font-size:13px;">
          配信対象: ${params.audienceLabel}
        </div>
      </div>
    </div>
  `;
}

export async function deliverCampaign(params: {
  campaignId: string;
  actorId: string;
  source: "admin" | "cron";
}) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  if (!isEmailConfigured()) {
    throw new Error("Resend is not configured.");
  }

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: params.campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (campaign.status === EmailCampaignStatus.SENT) {
    return { deliveredCount: 0, skipped: true as const, campaign };
  }

  const targetJson = (campaign.targetJson as { planCodes?: MembershipPlanCode[] } | null) ?? {};
  const planCodes = targetJson.planCodes?.length ? targetJson.planCodes : undefined;

  const members = await prisma.user.findMany({
    where: {
      status: MemberStatus.ACTIVE,
      planAssignments: {
        some: {
          isActive: true,
          ...(planCodes ? { plan: { code: { in: planCodes } } } : {}),
        },
      },
    },
    select: {
      email: true,
    },
    distinct: ["email"],
  });

  const audienceLabel = formatAudienceLabel(planCodes);
  const html = buildCampaignEmailHtml({
    title: campaign.subject,
    previewText: campaign.previewText,
    bodyHtml: campaign.bodyHtml,
    audienceLabel,
  });

  for (const member of members) {
    await sendEmail({
      to: member.email,
      subject: campaign.subject,
      html,
    });
  }

  const sentAt = new Date();
  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      status: EmailCampaignStatus.SENT,
      sentAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: params.actorId,
      action: "campaign.send",
      targetType: "EmailCampaign",
      targetId: campaign.id,
      metadata: {
        source: params.source,
        deliveredCount: members.length,
        planCodes: planCodes ?? null,
      },
    },
  });

  return { deliveredCount: members.length, skipped: false as const, campaign };
}

export async function deliverScheduledCampaigns(actorId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  if (!isEmailConfigured()) {
    return {
      campaigns: 0,
      deliveredCount: 0,
      skippedReason: "email_not_configured" as const,
    };
  }

  const dueCampaigns = await prisma.emailCampaign.findMany({
    where: {
      status: EmailCampaignStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
    select: { id: true },
    orderBy: { scheduledAt: "asc" },
  });

  let deliveredCount = 0;
  for (const campaign of dueCampaigns) {
    const result = await deliverCampaign({
      campaignId: campaign.id,
      actorId,
      source: "cron",
    });
    deliveredCount += result.deliveredCount;
  }

  return {
    campaigns: dueCampaigns.length,
    deliveredCount,
    skippedReason: null,
  };
}
