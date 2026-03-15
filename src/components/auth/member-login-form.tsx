"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { KeyRound, Loader2, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Mode = "sign-in" | "reset-request" | "reset-verify";

function formatClerkError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown[] }).errors) &&
    (error as { errors: Array<{ longMessage?: string; message?: string }> }).errors.length > 0
  ) {
    const first = (error as { errors: Array<{ longMessage?: string; message?: string }> }).errors[0];
    return first.longMessage ?? first.message ?? "認証に失敗しました。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "認証に失敗しました。";
}

export function MemberLoginForm() {
  const router = useRouter();
  const clerk = useClerk();
  const { signIn, fetchStatus } = useSignIn();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [pending, setPending] = useState(false);

  const isResetMode = useMemo(() => mode !== "sign-in", [mode]);
  const isBusy = pending || fetchStatus === "fetching";

  async function navigateToApp() {
    await signIn.finalize({
      navigate: async ({ decorateUrl }) => {
        const url = decorateUrl("/app");

        if (url.startsWith("http")) {
          window.location.href = url;
          return;
        }

        startTransition(() => {
          router.push(url);
          router.refresh();
        });
      },
    });
  }

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clerk.loaded) {
      toast("認証の準備中です。少し待ってから再度お試しください。", "error");
      return;
    }

    setPending(true);

    try {
      const result = await signIn.password({
        identifier: email.trim(),
        password,
      });

      if (result.error) {
        toast(formatClerkError(result.error), "error");
        return;
      }

      if (signIn.status === "complete" && signIn.createdSessionId) {
        await navigateToApp();
        return;
      }

      toast("追加の認証が必要です。ログイン方法を確認してください。", "error");
    } catch (error) {
      toast(formatClerkError(error), "error");
    } finally {
      setPending(false);
    }
  }

  async function handleSocialSignIn(strategy: "oauth_google" | "oauth_x") {
    if (!clerk.loaded) {
      toast("認証の準備中です。少し待ってから再度お試しください。", "error");
      return;
    }

    setPending(true);

    try {
      const result = await signIn.create({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        actionCompleteRedirectUrl: `${window.location.origin}/app`,
      });

      if (result.error) {
        toast(formatClerkError(result.error), "error");
        setPending(false);
      }
    } catch (error) {
      toast(formatClerkError(error), "error");
      setPending(false);
    }
  }

  async function handleResetRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clerk.loaded) {
      toast("認証の準備中です。少し待ってから再度お試しください。", "error");
      return;
    }

    setPending(true);

    try {
      await signIn.reset();

      const prepare = await signIn.create({
        identifier: email.trim(),
      });

      if (prepare.error) {
        toast(formatClerkError(prepare.error), "error");
        return;
      }

      const result = await signIn.resetPasswordEmailCode.sendCode();

      if (result.error) {
        toast(formatClerkError(result.error), "error");
        return;
      }

      setMode("reset-verify");
      toast("パスワード再設定コードを送信しました。メールをご確認ください。");
    } catch (error) {
      toast(formatClerkError(error), "error");
    } finally {
      setPending(false);
    }
  }

  async function handleResetVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clerk.loaded) {
      toast("認証の準備中です。少し待ってから再度お試しください。", "error");
      return;
    }

    setPending(true);

    try {
      const verify = await signIn.resetPasswordEmailCode.verifyCode({
        code: resetCode.trim(),
      });

      if (verify.error) {
        toast(formatClerkError(verify.error), "error");
        return;
      }

      const submit = await signIn.resetPasswordEmailCode.submitPassword({
        password: nextPassword,
      });

      if (submit.error) {
        toast(formatClerkError(submit.error), "error");
        return;
      }

      if (signIn.status === "complete" && signIn.createdSessionId) {
        await navigateToApp();
        return;
      }

      toast("パスワードを更新しました。新しいパスワードでログインしてください。");
      setMode("sign-in");
      setPassword("");
      setResetCode("");
      setNextPassword("");
    } catch (error) {
      toast(formatClerkError(error), "error");
    } finally {
      setPending(false);
    }
  }

  async function handleBackToSignIn() {
    await signIn.reset();
    setMode("sign-in");
    setResetCode("");
    setNextPassword("");
    setPassword("");
  }

  return (
    <div className="space-y-5">
      {!isResetMode ? (
        <div className="grid gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-2xl border border-black/10 bg-white py-3 text-slate-900 hover:bg-slate-50"
            onClick={() => void handleSocialSignIn("oauth_google")}
            disabled={isBusy}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Googleでログイン"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-2xl border border-black/10 bg-white py-3 text-slate-900 hover:bg-slate-50"
            onClick={() => void handleSocialSignIn("oauth_x")}
            disabled={isBusy}
          >
            Xでログイン
          </Button>
        </div>
      ) : null}

      {!isResetMode ? (
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-black/8" />
          <span className="text-xs text-slate-400">またはメールアドレスでログイン</span>
          <div className="h-px flex-1 bg-black/8" />
        </div>
      ) : null}

      {mode === "sign-in" ? (
        <form className="space-y-4" onSubmit={handlePasswordSignIn}>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail className="h-4 w-4" />
              メールアドレス
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
              placeholder="you@example.com"
              required
              disabled={isBusy}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LockKeyhole className="h-4 w-4" />
              パスワード
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
              placeholder="パスワードを入力"
              required
              disabled={isBusy}
            />
          </label>

          <Button type="submit" className="w-full rounded-2xl py-3" disabled={isBusy}>
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ログイン"}
          </Button>

          <button
            type="button"
            className="mx-auto block text-sm font-semibold text-[var(--color-primary)]"
            onClick={() => setMode("reset-request")}
            disabled={isBusy}
          >
            パスワードを忘れた方
          </button>
        </form>
      ) : null}

      {mode === "reset-request" ? (
        <form className="space-y-4" onSubmit={handleResetRequest}>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail className="h-4 w-4" />
              メールアドレス
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
              placeholder="you@example.com"
              required
              disabled={isBusy}
            />
          </label>

          <Button type="submit" className="w-full rounded-2xl py-3" disabled={isBusy}>
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "再設定コードを送る"}
          </Button>

          <button
            type="button"
            className="mx-auto block text-sm font-semibold text-slate-500"
            onClick={() => void handleBackToSignIn()}
            disabled={isBusy}
          >
            ログインへ戻る
          </button>
        </form>
      ) : null}

      {mode === "reset-verify" ? (
        <form className="space-y-4" onSubmit={handleResetVerify}>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <KeyRound className="h-4 w-4" />
              確認コード
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
              placeholder="メールに届いたコード"
              required
              disabled={isBusy}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LockKeyhole className="h-4 w-4" />
              新しいパスワード
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
              placeholder="新しいパスワード"
              required
              disabled={isBusy}
            />
          </label>

          <Button type="submit" className="w-full rounded-2xl py-3" disabled={isBusy}>
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "パスワードを更新"}
          </Button>

          <button
            type="button"
            className="mx-auto block text-sm font-semibold text-slate-500"
            onClick={() => void handleBackToSignIn()}
            disabled={isBusy}
          >
            ログインへ戻る
          </button>
        </form>
      ) : null}
    </div>
  );
}
