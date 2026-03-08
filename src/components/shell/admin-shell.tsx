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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(18,56,198,0.18),transparent_24%),linear-gradient(180deg,#0c1324,#10192f)] p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1500px] gap-6 rounded-[36px] border border-white/8 bg-[#0f182b]/98 p-3 shadow-[0_50px_120px_rgba(2,8,23,0.55)] md:grid-cols-[300px_minmax(0,1fr)] md:p-4">
        <aside className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-5 text-white">
          <BrandMark compact href="/admin" className="[&_*]:text-white" />
          <div className="mt-8 space-y-2">
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
                    "flex items-center gap-3 rounded-[20px] border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-[#f6c453]/60 bg-[linear-gradient(135deg,rgba(246,196,83,0.26),rgba(255,255,255,0.14))] text-white shadow-[0_18px_40px_rgba(246,196,83,0.18)]"
                      : "border-transparent text-white/72 hover:border-white/10 hover:bg-white/6 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-8 rounded-[26px] border border-white/10 bg-white/6 p-5">
            <div className="text-xs font-semibold tracking-[0.18em] text-white/45">ログイン中</div>
            <div className="mt-3 font-display text-xl font-bold text-white">{user.name}</div>
            <div className="mt-2 text-sm text-white/65">{user.email}</div>
          </div>
        </aside>
        <div className="rounded-[30px] bg-[linear-gradient(180deg,#f8f6f1,#f1eee7)] p-6 md:p-8">
          <header className="flex flex-col gap-4 border-b border-black/6 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-slate-500">DDS 管理コンソール</div>
              <div className="font-display text-2xl font-bold text-slate-950">{user.name}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <ExternalLink className="h-4 w-4" />
                受講生画面を見る
              </Link>
              <LogoutButton />
            </div>
          </header>
          <main className="mt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
