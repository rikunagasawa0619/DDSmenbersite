"use client";

import { logoutAction } from "@/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="dds-shell-action rounded-full px-4 py-2 text-sm font-semibold">
        ログアウト
      </button>
    </form>
  );
}
