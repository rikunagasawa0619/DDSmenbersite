"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type LoginActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: LoginActionState = {};

export function MemberLoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[var(--color-primary)]"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
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
        {pending ? "ログイン中..." : "ログイン"}
      </Button>
      <div className="flex items-center justify-between gap-4 text-sm">
        <Link href="/reset-password" className="font-semibold text-[var(--color-primary)]">
          パスワードを忘れた方
        </Link>
        <span className="text-slate-500">ログイン後は会員画面に移動します</span>
      </div>
    </form>
  );
}
