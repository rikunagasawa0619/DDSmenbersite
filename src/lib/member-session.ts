import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { memberAuthCookieName, memberSessionMaxAgeSeconds } from "@/lib/config";

type MemberSessionPayload = {
  userId: string;
  exp: number;
};

function getSessionSecret() {
  const secret =
    process.env.MEMBER_SESSION_SECRET ||
    process.env.CRON_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    (process.env.NODE_ENV !== "production" ? "dds-local-auth-development-secret" : undefined);

  if (!secret) {
    throw new Error("Session secret is not configured.");
  }

  return secret;
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createMemberSessionToken(
  userId: string,
  now = Date.now(),
  maxAgeSeconds = memberSessionMaxAgeSeconds,
) {
  const payload = JSON.stringify({
    userId,
    exp: now + maxAgeSeconds * 1000,
  } satisfies MemberSessionPayload);
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyMemberSessionToken(token: string, now = Date.now()) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as MemberSessionPayload;

    if (!decoded.userId || typeof decoded.exp !== "number" || decoded.exp <= now) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function readMemberSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(memberAuthCookieName)?.value;

  if (!token) {
    return null;
  }

  return verifyMemberSessionToken(token)?.userId ?? null;
}

export async function createMemberSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(memberAuthCookieName, createMemberSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: memberSessionMaxAgeSeconds,
  });
}

export async function destroyMemberSession() {
  const cookieStore = await cookies();
  cookieStore.delete(memberAuthCookieName);
}
