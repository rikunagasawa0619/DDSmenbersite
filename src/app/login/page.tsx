import Link from "next/link";
import { redirect } from "next/navigation";

import { MemberLoginForm } from "@/components/auth/member-login-form";
import { BrandMark } from "@/components/brand-mark";
import { Card } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth";

export default async function LoginPage() {
  const { member, hasAuthenticatedSession } = await getCurrentUserContext();

  if (member && !["paused", "withdrawn", "suspended"].includes(member.status)) {
    redirect("/app");
  }

  if (hasAuthenticatedSession && !member) {
    redirect("/access-denied?reason=not-provisioned");
  }

  if (member && ["paused", "withdrawn", "suspended"].includes(member.status)) {
    redirect(`/access-denied?reason=${member.status}`);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <Card className="w-full overflow-hidden p-8 md:p-10">
          <div className="flex justify-center">
            <BrandMark compact href="/" />
          </div>

          <div className="mt-8 text-center">
            <h1 className="font-display text-3xl font-black tracking-[-0.08em] text-slate-950">
              DDS ログイン
            </h1>
          </div>

          <div className="mt-8">
            <MemberLoginForm />
          </div>

          <div className="mt-8 flex justify-center gap-4 text-xs text-slate-500">
            <Link href="/privacy" className="font-semibold text-[var(--color-primary)]">
              プライバシー
            </Link>
            <Link href="/terms" className="font-semibold text-[var(--color-primary)]">
              利用規約
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
