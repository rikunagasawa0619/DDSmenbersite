"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";

function resolveInitialTheme() {
  if (typeof window === "undefined") {
    return "light" as const;
  }

  const stored = window.localStorage.getItem("dds-theme");
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("dds-theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      aria-label={theme === "dark" ? "ライトモードに切り替える" : "ダークモードに切り替える"}
    >
      {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      {theme === "dark" ? "ライト" : "ダーク"}
    </button>
  );
}
