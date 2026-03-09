"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrushCleaning, CalendarCog, ExternalLink, FileSpreadsheet, LayoutDashboard, Mail, Palette, ScrollText, Settings2, Users } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
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
    <div className="min-h-screen bg-[linear-gradient(135deg,#08121f,#13213c_56%,#17366d)] p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1540px] gap-6 rounded-[40px] border border-white/8 bg-[linear-gradient(145deg,rgba(8,18,31,0.96),rgba(11,22,41,0.9))] p-3 shadow-[0_60px_140px_rgba(2,8,23,0.62)] md:grid-cols-[320px_minmax(0,1fr)] md:p-4">
        <aside className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 text-white">
          <div className="absolute right-[-44px] top-[-44px] h-32 w-32 rounded-full bg-[rgba(215,255,100,0.18)] blur-2xl" />
          <div className="absolute bottom-8 left-[-30px] h-28 w-28 rounded-full bg-[rgba(45,91,255,0.2)] blur-2xl" />
          <BrandMark compact href="/admin" className="relative z-10 [&_*]:text-white" />
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
                  className={cn(
                    "flex items-center gap-3 rounded-[22px] border px-4 py-3 transition",
                    active
                      ? "border-[rgba(215,255,100,0.35)] bg-[linear-gradient(135deg,rgba(215,255,100,0.88),rgba(153,205,255,0.78))] text-slate-950 shadow-[0_18px_40px_rgba(45,91,255,0.22)]"
                      : "border-transparent text-white/84 hover:border-white/10 hover:bg-white/6 hover:text-white",
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
          <div className="relative z-10 mt-10 rounded-[28px] border border-white/10 bg-black/18 p-5 backdrop-blur">
            <div className="dds-kicker text-slate-300">ログイン中</div>
            <div className="mt-4 text-2xl font-light tracking-[-0.04em] text-white">{user.name}</div>
            <div className="mt-2 text-sm text-slate-200">{user.email}</div>
          </div>
        </aside>
        <div className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,#f6f1e5,#ede6d7_48%,#f4efe5)] p-6 md:p-8">
          <div className="absolute left-1/3 top-0 h-44 w-44 rounded-full bg-[rgba(215,255,100,0.16)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[rgba(45,91,255,0.1)] blur-3xl" />
          <header className="relative flex flex-col gap-4 border-b border-black/8 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="dds-kicker text-[var(--color-primary)]">dds 管理コンソール</div>
              <div className="mt-3 font-display text-3xl font-extrabold tracking-[-0.08em] text-slate-950 md:text-4xl">
                DDS 管理画面
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <ExternalLink className="h-4 w-4" />
                受講生画面
              </Link>
              <LogoutButton />
            </div>
          </header>
          <main className="relative mt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
