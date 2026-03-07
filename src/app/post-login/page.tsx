import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth";

export default async function PostLoginPage() {
  const { member, hasAuthenticatedSession } = await getCurrentUserContext();

  if (!member) {
    redirect(hasAuthenticatedSession ? "/access-denied?reason=not-provisioned" : "/login");
  }

  if (member.status === "suspended") {
    redirect("/access-denied?reason=suspended");
  }

  if (member.role === "super_admin" || member.role === "staff") {
    redirect("/admin");
  }

  redirect("/app");
}
