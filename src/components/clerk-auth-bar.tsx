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
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-[var(--color-primary)]">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-full bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2ca0]">
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
