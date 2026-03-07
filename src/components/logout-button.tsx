"use client";

import { SignOutButton } from "@clerk/nextjs";

import { demoLogoutAction } from "@/actions/auth";
import { isClerkConfigured } from "@/lib/config";

export function LogoutButton() {
  if (isClerkConfigured) {
    return (
      <SignOutButton>
        <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          ログアウト
        </button>
      </SignOutButton>
    );
  }

  return (
    <form action={demoLogoutAction}>
      <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
        ログアウト
      </button>
    </form>
  );
}
