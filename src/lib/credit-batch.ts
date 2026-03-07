import { prisma } from "@/lib/prisma";
import { buildMonthlyGrantEntry, getCycleRange } from "@/lib/credits";
import type { MembershipPlan } from "@/lib/types";

type ProcessMonthlyCreditGrantsParams = {
  actorId?: string;
  source: "admin" | "cron";
  now?: Date;
};

export type MonthlyCreditGrantResult = {
  processed: number;
  granted: number;
  skipped: number;
};

function mapPlan(plan: {
  code: "HOBBY" | "BIZ" | "PRO";
  name: string;
  heroLabel: string | null;
  description: string | null;
  monthlyCreditGrant: number;
  rolloverCap: number;
  unlimitedCredits: boolean;
  cycleBasis: "CALENDAR_MONTH" | "CONTRACT_DATE";
}): MembershipPlan {
  return {
    code: plan.code,
    name: plan.name,
    heroLabel: plan.heroLabel ?? plan.name,
    description: plan.description ?? "",
    monthlyCreditGrant: plan.monthlyCreditGrant,
    rolloverCap: plan.rolloverCap,
    unlimitedCredits: plan.unlimitedCredits,
    cycleBasis: plan.cycleBasis === "CALENDAR_MONTH" ? "calendar_month" : "contract_date",
  };
}

export async function processMonthlyCreditGrants(
  params: ProcessMonthlyCreditGrantsParams,
): Promise<MonthlyCreditGrantResult> {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const now = params.now ?? new Date();
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    include: {
      wallet: true,
      planAssignments: {
        where: { isActive: true },
        include: { plan: true },
        take: 1,
      },
    },
  });

  let granted = 0;
  let skipped = 0;

  for (const user of users) {
    const assignment = user.planAssignments[0];
    if (!assignment) {
      skipped += 1;
      continue;
    }

    const plan = mapPlan(assignment.plan);
    if (plan.unlimitedCredits) {
      skipped += 1;
      continue;
    }

    const wallet =
      user.wallet ??
      (await prisma.creditWallet.create({
        data: {
          userId: user.id,
          currentBalance: 0,
        },
      }));

    const { start, end } = getCycleRange(
      plan,
      now,
      user.contractStartAt.toISOString(),
      user.creditGrantDay ?? undefined,
    );
    const alreadyGranted = await prisma.creditLedger.findFirst({
      where: {
        walletId: wallet.id,
        type: "MONTHLY_GRANT",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    if (alreadyGranted) {
      skipped += 1;
      continue;
    }

    const grant = buildMonthlyGrantEntry({
      userId: user.id,
      plan,
      currentBalance: wallet.currentBalance,
      now,
    });

    if (grant.amount <= 0) {
      skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          currentBalance: {
            increment: grant.amount,
          },
        },
      });

      await tx.creditLedger.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: "MONTHLY_GRANT",
          amount: grant.amount,
          note: `${plan.name} の月次付与`,
        },
      });
    });

    granted += 1;
  }

  if (params.actorId) {
    await prisma.auditLog.create({
      data: {
        userId: params.actorId,
        action: "credits.monthly-grant.run",
        targetType: "CreditBatch",
        targetId: params.source,
        metadata: {
          processed: users.length,
          granted,
          skipped,
          source: params.source,
        },
      },
    });
  }

  return {
    processed: users.length,
    granted,
    skipped,
  };
}
