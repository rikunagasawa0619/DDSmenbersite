import Link from "next/link";

import { PasswordResetConfirmForm } from "@/components/auth/password-reset-confirm-form";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";
import { BrandMark } from "@/components/brand-mark";
import { Card } from "@/components/ui/card";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token?.trim();

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <Card className="w-full overflow-hidden p-8 md:p-10">
          <div className="flex justify-center">
            <BrandMark compact href="/" />
          </div>

          <div className="mt-8 text-center">
            <h1 className="font-display text-3xl font-black tracking-[-0.08em] text-slate-950">
              {token ? "パスワード再設定" : "パスワードを忘れた方"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              {token
                ? "新しいパスワードを設定すると、そのまま会員画面へログインします。"
                : "登録済みメールアドレスへ再設定リンクを送信します。"}
            </p>
          </div>

          <div className="mt-8">
            {token ? <PasswordResetConfirmForm token={token} /> : <PasswordResetRequestForm />}
          </div>

          <div className="mt-8 text-center text-sm">
            <Link href="/login" className="font-semibold text-[var(--color-primary)]">
              ログイン画面へ戻る
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
