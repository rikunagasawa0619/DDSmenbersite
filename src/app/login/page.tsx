import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { DemoLoginForm } from "@/components/auth/demo-login-form";
import { BrandMark } from "@/components/brand-mark";
import { Card } from "@/components/ui/card";
import { isClerkConfigured, isDemoAuthEnabled } from "@/lib/config";

export default function LoginPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <Card className="w-full overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,242,233,0.94))] p-8 md:p-10">
          <div className="flex justify-center">
            <BrandMark compact href="/" />
          </div>

          <div className="mt-8 text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950">
              DDS 会員サイト ログイン
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              講義予約、オンライン教材、お知らせ、イベントの確認はこちらから行えます。
            </p>
          </div>

          <div className="mt-8">
            {isClerkConfigured ? (
              <SignIn
                routing="hash"
                fallbackRedirectUrl="/post-login"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "w-full rounded-[28px] border border-black/8 bg-white/92 shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "rounded-2xl border border-black/10 bg-white text-slate-900",
                    formButtonPrimary:
                      "rounded-2xl bg-[var(--color-primary)] text-white shadow-[0_18px_42px_rgba(18,56,198,0.18)] hover:opacity-92",
                    formFieldInput: "rounded-2xl border border-black/10 bg-white",
                    footerActionLink: "text-[var(--color-primary)]",
                  },
                }}
              />
            ) : isDemoAuthEnabled ? (
              <div className="space-y-5">
                <DemoLoginForm />
                <div className="rounded-[24px] border border-dashed border-black/10 bg-white/65 p-5 text-sm leading-7 text-slate-600">
                  <div className="font-semibold text-slate-950">開発用デモアカウント</div>
                  <div className="mt-2">管理者: admin@dds.example / admin-demo</div>
                  <div>スタッフ: staff@dds.example / staff-demo</div>
                  <div>受講生: hobby@dds.example / student-demo</div>
                  <div>Pro会員: pro@dds.example / student-demo</div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
                現在、ログイン設定の最終確認中です。しばらくしてから再度お試しください。
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/" className="font-semibold text-[var(--color-primary)]">
              トップへ戻る
            </Link>
            <Link href="/privacy" className="font-semibold text-[var(--color-primary)]">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="font-semibold text-[var(--color-primary)]">
              利用規約
            </Link>
            <Link href="/tokushoho" className="font-semibold text-[var(--color-primary)]">
              特商法表記
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
