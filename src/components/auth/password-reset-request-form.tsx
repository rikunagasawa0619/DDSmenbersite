"use client";

import { useActionState } from "react";

import {
  requestPasswordResetAction,
  type PasswordRequestActionState,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: PasswordRequestActionState = {};

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="reset-email">
          メールアドレス
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
          required
        />
      </div>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending}>
        {pending ? "送信中..." : "再設定メールを送る"}
      </Button>
    </form>
  );
}
