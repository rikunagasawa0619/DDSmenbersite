import { describe, expect, it } from "vitest";

import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  verifyPassword,
} from "@/lib/password";

describe("password helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("DdsTemp!20260315");

    await expect(verifyPassword("DdsTemp!20260315", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("hashes reset tokens deterministically", () => {
    const token = createPasswordResetToken();
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
  });
});
