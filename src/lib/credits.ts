import { isBefore } from "date-fns";

import {
  endOfMonthInAppZone,
  formatIsoInAppZone,
  getContractCycleEnd,
  getContractCycleStart,
  getNextContractGrantDate,
  startOfMonthInAppZone,
} from "@/lib/datetime";
import type {
  CreditLedgerEntry,
  CreditWallet,
  MemberProfile,
  MembershipPlan,
  ReservationStatus,
} from "@/lib/types";

export function getNextGrantDate(
  plan: MembershipPlan,
  contractStartAt: string,
  now: Date,
  grantDayOverride?: number,
) {
  if (plan.unlimitedCredits) {
    return "常時";
  }

  if (plan.cycleBasis === "calendar_month") {
    const currentMonthStart = startOfMonthInAppZone(now);
    const nextMonthStart = startOfMonthInAppZone(new Date(currentMonthStart.getTime() + 35 * 24 * 60 * 60 * 1000));
    return formatIsoInAppZone(nextMonthStart);
  }

  return formatIsoInAppZone(getNextContractGrantDate(now, contractStartAt, grantDayOverride));
}

export function calculateBalance(entries: CreditLedgerEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export function getGrantAmount(
  plan: MembershipPlan,
  currentBalance: number,
  explicitCap?: number,
) {
  if (plan.unlimitedCredits) {
    return 0;
  }

  const cap = explicitCap ?? plan.rolloverCap;
  const remainingRoom = Math.max(cap - currentBalance, 0);
  return Math.min(plan.monthlyCreditGrant, remainingRoom);
}

export function buildMonthlyGrantEntry(params: {
  userId: string;
  plan: MembershipPlan;
  currentBalance: number;
  now: Date;
  capOverride?: number;
}) {
  const amount = getGrantAmount(
    params.plan,
    params.currentBalance,
    params.capOverride,
  );

  return {
    id: `grant-${params.userId}-${params.now.toISOString()}`,
    userId: params.userId,
    type: "monthly_grant" as const,
    amount,
    createdAt: params.now.toISOString(),
    note: `${params.plan.name} の月次付与`,
  };
}

export function createPlanChangeGrant(params: {
  userId: string;
  nextPlan: MembershipPlan;
  now: Date;
}) {
  if (params.nextPlan.unlimitedCredits) {
    return null;
  }

  return {
    id: `plan-change-${params.userId}-${params.now.toISOString()}`,
    userId: params.userId,
    type: "plan_change_grant" as const,
    amount: params.nextPlan.monthlyCreditGrant,
    createdAt: params.now.toISOString(),
    note: `${params.nextPlan.name} への即時切替付与`,
  };
}

export function createBonusGrant(params: {
  userId: string;
  amount: number;
  note: string;
  now: Date;
}) {
  return {
    id: `bonus-${params.userId}-${params.now.toISOString()}`,
    userId: params.userId,
    type: "bonus_grant" as const,
    amount: params.amount,
    createdAt: params.now.toISOString(),
    note: params.note,
  };
}

export function createBalanceAdjustment(params: {
  userId: string;
  delta: number;
  note: string;
  now: Date;
}) {
  return {
    id: `adjust-${params.userId}-${params.now.toISOString()}`,
    userId: params.userId,
    type: "balance_adjustment" as const,
    amount: params.delta,
    createdAt: params.now.toISOString(),
    note: params.note,
  };
}

export function createConsumptionEntry(params: {
  userId: string;
  amount: number;
  note: string;
  offeringId: string;
  now: Date;
}) {
  return {
    id: `consume-${params.userId}-${params.now.toISOString()}`,
    userId: params.userId,
    type: "consumed" as const,
    amount: params.amount * -1,
    createdAt: params.now.toISOString(),
    note: params.note,
    offeringId: params.offeringId,
  };
}

export function createRefundEntry(params: {
  userId: string;
  amount: number;
  note: string;
  offeringId: string;
  now: Date;
}) {
  return {
    id: `refund-${params.userId}-${params.now.toISOString()}`,
    userId: params.userId,
    type: "refunded" as const,
    amount: params.amount,
    createdAt: params.now.toISOString(),
    note: params.note,
    offeringId: params.offeringId,
  };
}

export function canReserveWithCredits(params: {
  wallet: CreditWallet;
  plan: MembershipPlan;
  creditRequired: number;
}) {
  if (params.plan.unlimitedCredits) {
    return true;
  }

  return params.wallet.currentBalance >= params.creditRequired;
}

export function canRefundCredit(refundDeadline: string, now: Date) {
  return isBefore(now, new Date(refundDeadline));
}

export function getCycleRange(
  plan: MembershipPlan,
  referenceDate: Date,
  contractStartAt: string,
  grantDayOverride?: number,
) {
  if (plan.cycleBasis === "calendar_month") {
    return {
      start: startOfMonthInAppZone(referenceDate),
      end: endOfMonthInAppZone(referenceDate),
    };
  }

  return {
    start: getContractCycleStart(referenceDate, contractStartAt, grantDayOverride),
    end: getContractCycleEnd(referenceDate, contractStartAt, grantDayOverride),
  };
}

export function summarizeWallet(
  user: MemberProfile,
  wallet: CreditWallet,
  plan: MembershipPlan,
) {
  return {
    userId: user.id,
    isUnlimited: plan.unlimitedCredits,
    availableCredits: plan.unlimitedCredits ? "無制限" : wallet.currentBalance,
    nextGrantAt: getNextGrantDate(plan, user.contractStartAt, new Date(), user.creditGrantDay),
    thisCycleConsumed: wallet.thisCycleConsumed,
    carriedOver: wallet.carriedOver,
  };
}

export function getReservationBadgeByStatus(status: ReservationStatus) {
  switch (status) {
    case "confirmed":
      return "予約確定";
    case "waitlisted":
      return "待機中";
    case "attended":
      return "参加済み";
    case "cancelled":
      return "キャンセル";
    case "no_show":
      return "不参加";
    default:
      return status;
  }
}
