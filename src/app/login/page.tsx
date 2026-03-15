import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoLoginForm } from "@/components/auth/demo-login-form";
import { BrandMark } from "@/components/brand-mark";
import { Card } from "@/components/ui/card";
import { isClerkConfigured, isDemoAuthEnabled } from "@/lib/config";
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
            {isClerkConfigured ? (
              <SignIn
                routing="path"
                path="/login"
                forceRedirectUrl="/app"
                signUpForceRedirectUrl="/app"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "w-full rounded-[28px] border border-black/8 bg-white/96 shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    formButtonPrimary:
                      "rounded-2xl bg-[var(--color-primary)] text-white shadow-[0_18px_42px_rgba(18,56,198,0.18)] hover:opacity-92",
                    formFieldInput: "rounded-2xl border border-black/10 bg-white",
                    footerActionLink: "text-[var(--color-primary)]",
                    socialButtonsBlockButton:
                      "rounded-2xl border border-black/10 bg-white text-slate-900 hover:bg-slate-50",
                    socialButtonsProviderIcon: "h-5 w-5",
                    socialButtonsBlock: "grid gap-3",
                    formFieldLabel: "text-slate-600",
                    formFieldInputShowPasswordButton:
                      "text-slate-500 hover:text-slate-900",
                    formResendCodeLink: "text-[var(--color-primary)]",
                    identityPreviewText: "text-slate-600",
                    identityPreviewEditButton: "text-[var(--color-primary)]",
                    footerActionText: "text-slate-500",
                    dividerText: "text-slate-400 text-xs",
                    dividerLine: "bg-black/8",
                  },
                }}
              />
            ) : isDemoAuthEnabled ? (
              <DemoLoginForm />
            ) : (
              <div className="rounded-[24px] border border-dashed border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
                現在、ログイン設定の最終確認中です。しばらくしてから再度お試しください。
              </div>
            )}
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
