import { describe, expect, it } from "vitest";

import {
  buildMonthlyGrantEntry,
  calculateBalance,
  canRefundCredit,
  createPlanChangeGrant,
  getCycleRange,
  getGrantAmount,
  getNextGrantDate,
} from "@/lib/credits";
import { sampleMembershipPlans, sampleWallets } from "@/lib/sample-data";

describe("credit logic", () => {
  const hobbyPlan = sampleMembershipPlans.find((plan) => plan.code === "HOBBY")!;
  const proPlan = sampleMembershipPlans.find((plan) => plan.code === "PRO")!;

  it("sums ledger entries into a balance", () => {
    expect(calculateBalance(sampleWallets[0].ledger)).toBe(3);
  });

  it("applies rollover cap when computing next grant", () => {
    expect(getGrantAmount(hobbyPlan, 8)).toBe(2);
    expect(getGrantAmount(hobbyPlan, 10)).toBe(0);
  });

  it("creates a plan change grant for non-unlimited plans", () => {
    const grant = createPlanChangeGrant({
      userId: "user-hobby",
      nextPlan: hobbyPlan,
      now: new Date("2026-03-07T00:00:00+09:00"),
    });

    expect(grant?.amount).toBe(4);
  });

  it("skips plan change grants for Pro", () => {
    const grant = createPlanChangeGrant({
      userId: "user-pro",
      nextPlan: proPlan,
      now: new Date("2026-03-07T00:00:00+09:00"),
    });

    expect(grant).toBeNull();
  });

  it("returns grant entry with capped amount", () => {
    const entry = buildMonthlyGrantEntry({
      userId: "user-biz",
      plan: hobbyPlan,
      currentBalance: 9,
      now: new Date("2026-03-07T00:00:00+09:00"),
    });

    expect(entry.amount).toBe(1);
  });

  it("allows refunds only before deadline", () => {
    expect(
      canRefundCredit("2026-03-11T18:00:00+09:00", new Date("2026-03-11T17:00:00+09:00")),
    ).toBe(true);

    expect(
      canRefundCredit("2026-03-11T18:00:00+09:00", new Date("2026-03-11T19:00:00+09:00")),
    ).toBe(false);
  });

  it("uses the next contract-day boundary for contract-based plans", () => {
    expect(
      getNextGrantDate(
        sampleMembershipPlans.find((plan) => plan.code === "BIZ")!,
        "2026-01-20T09:00:00+09:00",
        new Date("2026-03-07T12:00:00+09:00"),
      ),
    ).toBe("2026-03-20T00:00:00+09:00");
  });

  it("computes the current contract-date cycle correctly before the anchor day", () => {
    const range = getCycleRange(
      sampleMembershipPlans.find((plan) => plan.code === "BIZ")!,
      new Date("2026-03-07T12:00:00+09:00"),
      "2026-01-20T09:00:00+09:00",
    );

    expect(range.start.toISOString()).toBe("2026-02-19T15:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-03-19T14:59:59.999Z");
  });
});
