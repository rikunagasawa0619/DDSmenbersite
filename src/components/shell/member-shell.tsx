"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Home, CalendarDays, HelpCircle, LayoutGrid, Settings, Sparkles, Ticket, Wrench } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
        <div className="dds-shell-frame rounded-[32px] p-4 backdrop-blur md:p-6">
          <header className="flex flex-col gap-5 border-b border-[var(--color-outline)] pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <BrandMark href="/app" />
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">DDS Members</div>
                <div className="font-display text-xl font-black tracking-[-0.05em] text-[var(--color-foreground)]">{user.name}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand">{labelPlan(user.planCode)}</Badge>
              <Badge tone="neutral">{user.title}</Badge>
              {["super_admin", "staff"].includes(user.role) ? (
                <Link
                  href="/admin"
                  className="dds-shell-action inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <ExternalLink className="h-4 w-4" />
                  管理画面へ
                </Link>
              ) : null}
              <Link
                href="/app/profile"
                className="dds-shell-action inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Settings className="h-4 w-4" />
                プロフィール
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </header>
          <nav className="mt-6 hidden flex-wrap gap-2 md:flex">
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
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className={cn(
                    "dds-shell-nav-link inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <main id="main-content" className="mt-8">{children}</main>
          <nav className="dds-shell-mobile-dock fixed inset-x-4 bottom-4 z-40 grid grid-cols-4 gap-2 rounded-[28px] p-2 shadow-[0_20px_60px_rgba(15,23,42,0.15)] backdrop-blur md:hidden">
            {navigation.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/app" ? currentPath === item.href : currentPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className={cn(
                    "dds-shell-nav-link flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] border px-2 text-[11px] font-semibold transition",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
