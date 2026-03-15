"use client";

import { useEffect, useState } from "react";
import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export function MemberLoginForm() {
  const [showDelayedHelp, setShowDelayedHelp] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowDelayedHelp(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <ClerkLoading>
        {showDelayedHelp ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-950">
            認証システムを接続中です。しばらく待っても入力欄が出ない場合は、管理者側で DNS 設定の反映待ちです。
          </div>
        ) : (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          </div>
        )}
      </ClerkLoading>

      <ClerkLoaded>
        <SignIn
          path="/login"
          routing="path"
          forceRedirectUrl="/app"
          fallbackRedirectUrl="/app"
          withSignUp={false}
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none",
              card: "w-full border-0 bg-transparent p-0 shadow-none",
              header: "hidden",
              footer: "hidden",
              dividerText: "text-xs text-slate-400",
              dividerLine: "bg-black/8",
              socialButtonsBlockButton:
                "h-12 rounded-2xl border border-black/10 bg-white text-slate-900 shadow-none transition hover:bg-slate-50",
              socialButtonsBlockButtonText: "font-semibold text-slate-900",
              formButtonPrimary:
                "h-12 rounded-2xl bg-[var(--color-primary)] font-semibold text-white shadow-none transition hover:brightness-95",
              formFieldLabel: "text-sm font-semibold text-slate-700",
              formFieldInput:
                "h-12 rounded-2xl border border-black/10 bg-white px-4 text-base text-slate-950 shadow-none transition focus:border-[var(--color-primary)]",
              formFieldHintText: "text-xs text-slate-500",
              formFieldWarningText: "text-xs text-amber-700",
              formFieldErrorText: "text-xs text-red-600",
              formResendCodeLink: "font-semibold text-[var(--color-primary)]",
              footerActionLink: "font-semibold text-[var(--color-primary)]",
              identityPreviewText: "text-slate-700",
              identityPreviewEditButton: "font-semibold text-[var(--color-primary)]",
              otpCodeFieldInput:
                "h-12 rounded-2xl border border-black/10 bg-white text-slate-950 shadow-none",
            },
          }}
        />
      </ClerkLoaded>
    </>
  );
}
