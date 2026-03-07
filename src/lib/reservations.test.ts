import { describe, expect, it } from "vitest";

import { canUserApplyToOffering, getOfferingCounts } from "@/lib/reservations";
import {
  sampleMembershipPlans,
  sampleOfferings,
  sampleReservations,
  sampleUsers,
  sampleWaitlistEntries,
  sampleWallets,
} from "@/lib/sample-data";

describe("reservation rules", () => {
  it("counts confirmed seats and waitlist", () => {
    const counts = getOfferingCounts(
      sampleOfferings[2],
      sampleReservations,
      sampleWaitlistEntries,
    );

    expect(counts.confirmed).toBe(1);
    expect(counts.waitlist).toBe(1);
  });

  it("rejects offerings outside the user's audience", () => {
    const result = canUserApplyToOffering({
      user: sampleUsers[2],
      plan: sampleMembershipPlans[0],
      wallet: sampleWallets[0],
      offering: sampleOfferings[3],
      reservations: sampleReservations,
      waitlistEntries: sampleWaitlistEntries,
    });

    expect(result.allowed).toBe(false);
  });

  it("allows Pro users on Pro-only offerings", () => {
    const result = canUserApplyToOffering({
      user: sampleUsers[4],
      plan: sampleMembershipPlans[2],
      wallet: sampleWallets[2],
      offering: sampleOfferings[3],
      reservations: sampleReservations.filter((item) => item.offeringId !== "off-04"),
      waitlistEntries: sampleWaitlistEntries,
    });

    expect(result.allowed).toBe(true);
  });

  it("allows waitlist registration even when on_confirm credits are currently insufficient", () => {
    const fullWaitlistOffering = {
      ...sampleOfferings[0],
      id: "off-full-waitlist",
      slug: "off-full-waitlist",
      waitlistEnabled: true,
      capacity: 1,
      creditRequired: 2,
      consumptionMode: "on_confirm" as const,
    };

    const result = canUserApplyToOffering({
      user: sampleUsers[2],
      plan: sampleMembershipPlans[0],
      wallet: { ...sampleWallets[0], currentBalance: 0 },
      offering: fullWaitlistOffering,
      reservations: [
        ...sampleReservations,
        {
          id: "res-full",
          offeringId: "off-full-waitlist",
          userId: "user-biz",
          status: "confirmed",
          createdAt: "2026-03-07T10:00:00+09:00",
        },
      ],
      waitlistEntries: sampleWaitlistEntries,
    });

    expect(result.allowed).toBe(true);
    expect(result.waitlist).toBe(true);
  });

  it("allows on_attend bookings without checking credits at reservation time", () => {
    const onAttendOffering = {
      ...sampleOfferings[0],
      id: "off-on-attend",
      slug: "off-on-attend",
      consumptionMode: "on_attend" as const,
      creditRequired: 2,
    };

    const result = canUserApplyToOffering({
      user: sampleUsers[2],
      plan: sampleMembershipPlans[0],
      wallet: { ...sampleWallets[0], currentBalance: 0 },
      offering: onAttendOffering,
      reservations: sampleReservations,
      waitlistEntries: sampleWaitlistEntries,
    });

    expect(result.allowed).toBe(true);
    expect(result.waitlist).toBe(false);
  });
});
