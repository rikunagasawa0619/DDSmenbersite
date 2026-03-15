"use client";

import { useActionState } from "react";

import { resetPasswordAction, type PasswordUpdateActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: PasswordUpdateActionState = {};

export function PasswordResetConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="new-password">
          新しいパスワード
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="new-password-confirm">
          新しいパスワード確認
        </label>
        <input
          id="new-password-confirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
          required
        />
      </div>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending}>
        {pending ? "更新中..." : "パスワードを更新する"}
      </Button>
    </form>
  );
}
