import type {
  CreditConsumptionMode,
  CreditLedgerType,
  MemberStatus,
  MembershipPlanCode,
  OfferingType,
  PlanCycleBasis,
  ReservationStatus,
  UserRole,
} from "@/lib/types";
import { formatInTimeZone } from "date-fns-tz";

import { appTimeZone } from "@/lib/datetime";

export const planOrder: MembershipPlanCode[] = ["HOBBY", "BIZ", "PRO"];

export const roleLabelMap: Record<UserRole, string> = {
  super_admin: "管理者",
  staff: "運営スタッフ",
  student: "受講生",
};

export const memberStatusLabelMap: Record<MemberStatus, string> = {
  active: "利用中",
  invited: "招待中",
  paused: "休会中",
  withdrawn: "退会済み",
  suspended: "利用停止",
};

export const cycleBasisLabelMap: Record<PlanCycleBasis, string> = {
  calendar_month: "毎月1日",
  contract_date: "会員ごとの基準日",
};

export const offeringTypeLabelMap: Record<OfferingType, string> = {
  booking: "講義予約",
  event: "イベント",
};

export const consumptionModeLabelMap: Record<CreditConsumptionMode, string> = {
  on_confirm: "予約確定時に消費",
  on_attend: "参加確定時に消費",
};

export const reservationStatusLabelMap: Record<ReservationStatus, string> = {
  confirmed: "予約確定",
  waitlisted: "待機中",
  cancelled: "キャンセル",
  attended: "参加済み",
  no_show: "欠席",
};

export const creditLedgerLabelMap: Record<CreditLedgerType, string> = {
  monthly_grant: "月次付与",
  bonus_grant: "手動付与",
  balance_adjustment: "残高補正",
  plan_change_grant: "プラン変更付与",
  consumed: "消費",
  refunded: "返却",
};

export function labelRole(role: UserRole) {
  return roleLabelMap[role];
}

export function labelMemberStatus(status: MemberStatus) {
  return memberStatusLabelMap[status];
}

export function labelCycleBasis(cycleBasis: PlanCycleBasis) {
  return cycleBasisLabelMap[cycleBasis];
}

export function labelOfferingType(offeringType: OfferingType) {
  return offeringTypeLabelMap[offeringType];
}

export function labelConsumptionMode(mode: CreditConsumptionMode) {
  return consumptionModeLabelMap[mode];
}

export function labelReservationStatus(status: ReservationStatus) {
  return reservationStatusLabelMap[status];
}

export function labelLedgerType(type: CreditLedgerType) {
  return creditLedgerLabelMap[type];
}

export function labelPlan(code: MembershipPlanCode) {
  if (code === "HOBBY") return "DDS Hobby";
  if (code === "BIZ") return "DDS Biz";
  return "DDS Pro";
}

export function expandMinimumPlan(minimumPlanCode?: MembershipPlanCode | null) {
  if (!minimumPlanCode) {
    return [...planOrder];
  }

  const startIndex = planOrder.indexOf(minimumPlanCode);
  return planOrder.slice(startIndex >= 0 ? startIndex : 0);
}

export function getMinimumPlanCodeFromAudience(
  planCodes?: MembershipPlanCode[],
): MembershipPlanCode {
  if (!planCodes || planCodes.length === 0) {
    return "HOBBY";
  }

  if (planCodes.includes("HOBBY")) {
    return "HOBBY";
  }

  if (planCodes.includes("BIZ")) {
    return "BIZ";
  }

  return "PRO";
}

export function labelMinimumPlan(minimumPlanCode: MembershipPlanCode) {
  if (minimumPlanCode === "HOBBY") {
    return "DDS Hobby 以上";
  }

  if (minimumPlanCode === "BIZ") {
    return "DDS Biz 以上";
  }

  return "DDS Pro のみ";
}

export function getCreditGrantDay(contractStartAt: string, creditGrantDay?: number) {
  if (creditGrantDay) {
    return creditGrantDay;
  }

  return Number(formatInTimeZone(contractStartAt, appTimeZone, "d"));
}
