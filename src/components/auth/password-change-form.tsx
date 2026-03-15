"use client";

import { useActionState } from "react";

import { updatePasswordAction, type PasswordUpdateActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: PasswordUpdateActionState = {};

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-500">現在のパスワード</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className="rounded-2xl border border-black/10 px-4 py-3"
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-500">新しいパスワード</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          className="rounded-2xl border border-black/10 px-4 py-3"
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-500">新しいパスワード確認</span>
        <input
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          className="rounded-2xl border border-black/10 px-4 py-3"
          required
        />
      </label>
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
      <Button disabled={pending}>{pending ? "更新中..." : "パスワードを変更"}</Button>
    </form>
  );
}
