"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Home, CalendarDays, HelpCircle, LayoutGrid, Settings, Sparkles, Ticket, Wrench } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { labelPlan } from "@/lib/admin-display";
import type { MemberProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/app", label: "ホーム", icon: Home },
  { href: "/app/deals", label: "お得情報", icon: Sparkles },
  { href: "/app/events", label: "イベント", icon: CalendarDays },
  { href: "/app/tools", label: "ツール", icon: Wrench },
  { href: "/app/bookings", label: "講義予約", icon: Ticket },
  { href: "/app/courses", label: "オンライン教材", icon: LayoutGrid },
  { href: "/app/faq", label: "FAQ", icon: HelpCircle },
];

export function MemberShell({
  user,
  children,
}: {
  user: MemberProfile;
  children: React.ReactNode;
}) {
  const currentPath = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="rounded-[32px] border border-white/60 bg-white/70 p-4 shadow-[0_40px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <header className="flex flex-col gap-5 border-b border-black/5 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <BrandMark href="/app" />
              <div className="space-y-1">
                <div className="text-sm text-slate-500">DDS 会員サイト</div>
                <div className="font-display text-xl font-bold text-slate-950">{user.name}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand">{labelPlan(user.planCode)}</Badge>
              <Badge tone="neutral">{user.title}</Badge>
              {["super_admin", "staff"].includes(user.role) ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <ExternalLink className="h-4 w-4" />
                  管理画面へ
                </Link>
              ) : null}
              <Link
                href="/app/profile"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Settings className="h-4 w-4" />
                プロフィール
              </Link>
              <LogoutButton />
            </div>
          </header>
          <nav className="mt-6 flex flex-wrap gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/app"
                  ? currentPath === item.href
                  : currentPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_18px_45px_rgba(18,56,198,0.24)]"
                      : "border-transparent bg-black/4 text-slate-600 hover:border-black/8 hover:bg-black/8 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <main className="mt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
