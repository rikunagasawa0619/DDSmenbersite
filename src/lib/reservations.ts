import type {
  CreditWallet,
  MemberProfile,
  MembershipPlan,
  Reservation,
  ReservableOffering,
  WaitlistEntry,
} from "@/lib/types";
import { canAccessAudience } from "@/lib/access";
import { canReserveWithCredits } from "@/lib/credits";
import type { OfferingCountSummary } from "@/lib/repository";

export function getOfferingCounts(
  offering: ReservableOffering,
  reservations: Reservation[],
  waitlistEntries: WaitlistEntry[],
) {
  const confirmed = reservations.filter(
    (reservation) =>
      reservation.offeringId === offering.id &&
      ["confirmed", "attended"].includes(reservation.status),
  ).length;

  const waitlist = waitlistEntries.filter(
    (entry) => entry.offeringId === offering.id,
  ).length;

  return {
    confirmed,
    waitlist,
    remaining: Math.max(offering.capacity - confirmed, 0),
    isFull: confirmed >= offering.capacity,
  };
}

export function getOfferingCountsFromSummary(
  offering: ReservableOffering,
  summary?: OfferingCountSummary,
) {
  const confirmed = summary?.confirmed ?? 0;
  const waitlist = summary?.waitlist ?? 0;

  return {
    confirmed,
    waitlist,
    remaining: Math.max(offering.capacity - confirmed, 0),
    isFull: confirmed >= offering.capacity,
  };
}

export function canUserApplyToOffering(params: {
  user: MemberProfile;
  plan: MembershipPlan;
  wallet: CreditWallet;
  offering: ReservableOffering;
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
}) {
  if (!canAccessAudience(params.user, params.offering.audience)) {
    return { allowed: false, reason: "現在のプランではこの募集枠に参加できません。" };
  }

  const counts = getOfferingCounts(
    params.offering,
    params.reservations,
    params.waitlistEntries,
  );

  const existingReservation = params.reservations.find(
    (reservation) =>
      reservation.userId === params.user.id &&
      reservation.offeringId === params.offering.id &&
      ["confirmed", "attended", "waitlisted"].includes(reservation.status),
  );
  const existingWaitlist = params.waitlistEntries.find(
    (entry) =>
      entry.userId === params.user.id && entry.offeringId === params.offering.id,
  );

  if (existingReservation || existingWaitlist) {
    return { allowed: false, reason: "すでに申込済みです。" };
  }

  if (counts.isFull && !params.offering.waitlistEnabled) {
    return { allowed: false, reason: "満席のため申込できません。" };
  }

  if (counts.isFull && params.offering.waitlistEnabled) {
    return { allowed: true, waitlist: true as const };
  }

  const needsCreditsNow =
    params.offering.consumptionMode === "on_confirm" &&
    params.offering.creditRequired > 0;

  if (
    needsCreditsNow &&
    !canReserveWithCredits({
      wallet: params.wallet,
      plan: params.plan,
      creditRequired: params.offering.creditRequired,
    })
  ) {
    return { allowed: false, reason: "クレジット残高が不足しています。" };
  }

  return { allowed: true, waitlist: false as const };
}

export function canUserApplyToOfferingWithCounts(params: {
  user: MemberProfile;
  plan: MembershipPlan;
  wallet: CreditWallet;
  offering: ReservableOffering;
  counts: ReturnType<typeof getOfferingCountsFromSummary>;
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
}) {
  if (!canAccessAudience(params.user, params.offering.audience)) {
    return { allowed: false, reason: "現在のプランではこの募集枠に参加できません。" };
  }

  const existingReservation = params.reservations.find(
    (reservation) =>
      reservation.userId === params.user.id &&
      reservation.offeringId === params.offering.id &&
      ["confirmed", "attended", "waitlisted"].includes(reservation.status),
  );
  const existingWaitlist = params.waitlistEntries.find(
    (entry) =>
      entry.userId === params.user.id && entry.offeringId === params.offering.id,
  );

  if (existingReservation || existingWaitlist) {
    return { allowed: false, reason: "すでに申込済みです。" };
  }

  if (params.counts.isFull && !params.offering.waitlistEnabled) {
    return { allowed: false, reason: "満席のため申込できません。" };
  }

  if (params.counts.isFull && params.offering.waitlistEnabled) {
    return { allowed: true, waitlist: true as const };
  }

  const needsCreditsNow =
    params.offering.consumptionMode === "on_confirm" &&
    params.offering.creditRequired > 0;

  if (
    needsCreditsNow &&
    !canReserveWithCredits({
      wallet: params.wallet,
      plan: params.plan,
      creditRequired: params.offering.creditRequired,
    })
  ) {
    return { allowed: false, reason: "クレジット残高が不足しています。" };
  }

  return { allowed: true, waitlist: false as const };
}
