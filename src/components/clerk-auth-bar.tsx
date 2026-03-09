"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";

import { isClerkConfigured } from "@/lib/config";

const hiddenPrefixes = ["/app", "/admin"];

export function ClerkAuthBar() {
  const pathname = usePathname();

  if (!isClerkConfigured) {
    return null;
  }

  if (pathname === "/login" || pathname === "/post-login") {
    return null;
  }

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-black/10 bg-[rgba(243,239,228,0.92)] px-3 py-2 shadow-[0_18px_40px_rgba(7,17,31,0.12)] backdrop-blur">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-full px-3 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:text-[var(--color-primary)]">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-full bg-[var(--color-primary)] px-3 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#2147d7]">
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </div>
  );
}
