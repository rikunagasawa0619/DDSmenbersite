import { describe, expect, it, vi } from "vitest";

describe("member session token", () => {
  it("creates and verifies signed tokens", async () => {
    vi.stubEnv("CRON_SECRET", "test-session-secret");
    const { createMemberSessionToken, verifyMemberSessionToken } = await import(
      "@/lib/member-session"
    );

    const token = createMemberSessionToken("user_123", 1000, 60);
    expect(verifyMemberSessionToken(token, 1000)).toMatchObject({ userId: "user_123" });
    expect(verifyMemberSessionToken(token, 61_500)).toBeNull();

    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects tampered tokens", async () => {
    vi.stubEnv("CRON_SECRET", "test-session-secret");
    const { createMemberSessionToken, verifyMemberSessionToken } = await import(
      "@/lib/member-session"
    );

    const token = createMemberSessionToken("user_123", 1000, 60);
    const tampered = `${token.slice(0, -1)}x`;

    expect(verifyMemberSessionToken(tampered, 1000)).toBeNull();

    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
