"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrushCleaning, CalendarCog, ExternalLink, FileSpreadsheet, LayoutDashboard, Mail, Palette, ScrollText, Settings2, Users } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { MemberProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const adminNavigation = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/members", label: "会員管理", icon: Users },
  { href: "/admin/plans", label: "プラン/クレジット", icon: Settings2 },
  { href: "/admin/content", label: "コンテンツ", icon: BrushCleaning },
  { href: "/admin/offerings", label: "募集枠", icon: CalendarCog },
  { href: "/admin/theme", label: "テーマ設定", icon: Palette },
  { href: "/admin/campaigns", label: "配信", icon: Mail },
  { href: "/admin/audit-logs", label: "監査ログ", icon: ScrollText },
  { href: "/admin/exports", label: "CSV出力", icon: FileSpreadsheet },
];

export function AdminShell({
  user,
  children,
}: {
  user: MemberProfile;
  children: React.ReactNode;
}) {
  const currentPath = usePathname();

  return (
    <div className="dds-shell-stage min-h-screen p-4 md:p-6">
      <div className="dds-shell-frame mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1540px] gap-6 rounded-[40px] p-3 md:grid-cols-[320px_minmax(0,1fr)] md:p-4">
        <aside className="dds-shell-sidebar relative overflow-hidden rounded-[34px] p-5">
          <BrandMark compact href="/admin" className="relative z-10" />
          <div className="relative z-10 mt-8 space-y-2">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/admin"
                  ? currentPath === item.href
                  : currentPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className={cn(
                    "dds-shell-nav-link flex items-center gap-3 rounded-[22px] px-4 py-3 transition",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.12em]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="dds-shell-user-card relative z-10 mt-10 rounded-[28px] p-5 backdrop-blur">
            <div className="dds-kicker text-[var(--color-muted)]">ログイン中</div>
            <div className="mt-4 text-2xl font-light tracking-[-0.04em] text-[var(--color-foreground)]">{user.name}</div>
            <div className="mt-2 text-sm text-[var(--color-muted-strong)]">{user.email}</div>
          </div>
        </aside>
        <div className="dds-shell-main relative overflow-hidden rounded-[34px] p-6 md:p-8">
          <header className="relative flex flex-col gap-4 border-b border-[var(--color-outline)] pb-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="dds-kicker text-[var(--color-primary)]">dds operations</div>
              <div className="mt-3 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950 md:text-4xl">
                DDS 管理画面
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <Link
                href="/app"
                className="dds-shell-action inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em]"
              >
                <ExternalLink className="h-4 w-4" />
                受講生画面
              </Link>
              <LogoutButton />
            </div>
          </header>
          <nav className="relative mt-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/admin" ? currentPath === item.href : currentPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className={cn(
                    "dds-shell-nav-link inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <main id="main-content" className="relative mt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
