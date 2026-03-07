"use client";

import { useActionState } from "react";

import { demoLoginAction, type LoginActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: LoginActionState = {};

export function DemoLoginForm() {
  const [state, action, pending] = useActionState(demoLoginAction, initialState);

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
          placeholder="admin@dds.example"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
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
          placeholder="••••••••"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
        />
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <Button className="w-full" disabled={pending}>
        {pending ? "ログイン中..." : "デモログイン"}
      </Button>
    </form>
  );
}
