import { describe, expect, it } from "vitest";

import { canAccessAudience, filterVisibleItems } from "@/lib/access";
import { sampleAnnouncements, sampleUsers } from "@/lib/sample-data";

describe("access control", () => {
  it("allows public content", () => {
    expect(canAccessAudience(sampleUsers[2], undefined)).toBe(true);
  });

  it("blocks Hobby users from Pro-only content", () => {
    expect(
      canAccessAudience(sampleUsers[2], { planCodes: ["PRO"] }),
    ).toBe(false);
  });

  it("keeps only visible announcements", () => {
    const visible = filterVisibleItems(sampleUsers[2], sampleAnnouncements);
    expect(visible.map((item) => item.id)).toEqual(["ann-01", "ann-02"]);
  });
});
