import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/lib/auth";

export default async function PostLoginPage() {
  const { member, hasAuthenticatedSession } = await getCurrentUserContext();

  if (!member) {
    redirect(hasAuthenticatedSession ? "/access-denied?reason=not-provisioned" : "/login");
  }

  if (["paused", "withdrawn", "suspended"].includes(member.status)) {
    redirect(`/access-denied?reason=${member.status}`);
  }

  if (member.role === "super_admin" || member.role === "staff") {
    redirect("/admin");
  }

  redirect("/app");
}
