import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { demoAuthCookieName, isClerkServerReady, isDemoAuthEnabled } from "@/lib/config";
import { sampleUsers } from "@/lib/sample-data";
import {
  getMemberByEmail,
  getMemberById,
  getMembershipPlanByCode,
  getWalletByUserId,
} from "@/lib/repository";
import type { CreditWallet, MemberProfile, MembershipPlan } from "@/lib/types";

export type CurrentUserContext = {
  member: MemberProfile | null;
  hasAuthenticatedSession: boolean;
};

export async function getCurrentUserContext(): Promise<CurrentUserContext> {
  if (isClerkServerReady) {
    const user = await clerkCurrentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) {
      return {
        member: null,
        hasAuthenticatedSession: Boolean(user),
      };
    }

    return {
      member: await getMemberByEmail(email),
      hasAuthenticatedSession: Boolean(user),
    };
  }

  if (!isDemoAuthEnabled) {
    return {
      member: null,
      hasAuthenticatedSession: false,
    };
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(demoAuthCookieName)?.value;

  if (!session) {
    return {
      member: null,
      hasAuthenticatedSession: false,
    };
  }

  return {
    member: (await getMemberById(session)) ?? null,
    hasAuthenticatedSession: true,
  };
}

export async function getCurrentUser(): Promise<MemberProfile | null> {
  return (await getCurrentUserContext()).member;
}

export async function requireUser() {
  const { member, hasAuthenticatedSession } = await getCurrentUserContext();

  if (!member) {
    redirect(hasAuthenticatedSession ? "/access-denied?reason=not-provisioned" : "/login");
  }

  if (member.status === "suspended") {
    redirect("/access-denied?reason=suspended");
  }

  return member;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!["super_admin", "staff"].includes(user.role)) {
    redirect("/app");
  }

  return user;
}

export async function createDemoSession(email: string, password: string) {
  if (!isDemoAuthEnabled) {
    return null;
  }

  const matched = sampleUsers.find(
    (user) => user.email === email && user.demoPassword === password,
  );

  if (!matched) {
    return null;
  }

  const cookieStore = await cookies();
  cookieStore.set(demoAuthCookieName, matched.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return matched;
}

export async function destroyDemoSession() {
  if (!isDemoAuthEnabled) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.delete(demoAuthCookieName);
}

export async function getPlanForUser(user: MemberProfile): Promise<MembershipPlan> {
  return getMembershipPlanByCode(user.planCode);
}

export async function getWalletForUser(
  user: MemberProfile,
  plan?: MembershipPlan,
): Promise<CreditWallet> {
  const resolvedPlan = plan ?? (await getPlanForUser(user));
  return getWalletByUserId(user.id, resolvedPlan, user.contractStartAt);
}
