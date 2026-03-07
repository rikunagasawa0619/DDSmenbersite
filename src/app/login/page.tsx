import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { DemoLoginForm } from "@/components/auth/demo-login-form";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isClerkConfigured, isDemoAuthEnabled } from "@/lib/config";

export default function LoginPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden bg-[linear-gradient(155deg,#0f172a,#1238c6)] p-8 text-white md:p-12">
          <BrandMark className="[&_*]:text-white" />
          <Badge tone="accent" >DDS Private Members</Badge>
          <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight">
            受講導線も、運営導線も、
            一つのログインから始まる。
          </h1>
          <p className="mt-5 max-w-xl text-white/82">
            管理者・スタッフ・受講生を同じ認証導線で受け、ログイン後の遷移先と表示内容を権限とプランに応じて切り替えます。
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[26px] bg-white/10 p-5">
              <div className="text-sm font-semibold text-[var(--color-accent)]">会員向け</div>
              <div className="mt-2 text-lg font-bold">ホーム / 予約 / 教材 / FAQ</div>
              <p className="mt-2 text-sm text-white/75">
                残クレジット、直近イベント、教材進捗、お知らせを一画面に集約。
              </p>
            </div>
            <div className="rounded-[26px] bg-white/10 p-5">
              <div className="text-sm font-semibold text-[var(--color-accent)]">運営向け</div>
              <div className="mt-2 text-lg font-bold">会員管理 / 付与 / 公開制御</div>
              <p className="mt-2 text-sm text-white/75">
                手動クレジット付与、プラン変更、セグメント設定、募集枠管理に対応。
              </p>
            </div>
          </div>
        </Card>

        <Card className="mx-auto w-full max-w-xl p-8 md:p-10">
          <div className="mb-8">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Sign in
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">
              ログインしてください
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              本番では Clerk を利用し、未設定の開発環境ではデモログインが使えます。
            </p>
          </div>

          {isClerkConfigured ? (
            <SignIn
              routing="hash"
              fallbackRedirectUrl="/post-login"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-black/8 rounded-[24px] w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                },
              }}
            />
          ) : isDemoAuthEnabled ? (
            <div className="space-y-6">
              <DemoLoginForm />
              <div className="rounded-[24px] border border-dashed border-black/10 bg-black/[0.02] p-5 text-sm leading-7 text-slate-600">
                <div className="font-semibold text-slate-950">デモアカウント</div>
                <div>管理者: admin@dds.example / admin-demo</div>
                <div>スタッフ: staff@dds.example / staff-demo</div>
                <div>受講生: hobby@dds.example / student-demo</div>
                <div>Pro会員: pro@dds.example / student-demo</div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
              現在、本番認証の設定中です。Clerk の本番キーを登録すると、この画面が通常ログインに切り替わります。
            </div>
          )}

          <div className="mt-8 text-sm text-slate-500">
            <div className="flex flex-wrap gap-4">
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
          </div>
        </Card>
      </div>
    </div>
  );
}
