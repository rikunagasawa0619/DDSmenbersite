"use client";

import { SignOutButton } from "@clerk/nextjs";

import { demoLogoutAction } from "@/actions/auth";
import { isClerkConfigured } from "@/lib/config";

export function LogoutButton() {
  if (isClerkConfigured) {
    return (
      <SignOutButton>
        <button className="dds-shell-action rounded-full px-4 py-2 text-sm font-semibold">
          ログアウト
        </button>
      </SignOutButton>
    );
  }

  return (
    <form action={demoLogoutAction}>
      <button className="dds-shell-action rounded-full px-4 py-2 text-sm font-semibold">
        ログアウト
      </button>
    </form>
  );
}
