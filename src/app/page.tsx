import Link from "next/link";
import { ArrowRight, CalendarDays, LayoutDashboard, ShieldCheck, Sparkles, Ticket } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: LayoutDashboard,
    title: "管理画面から運用を完結",
    body: "会員、教材、バナー、お知らせ、イベント、予約、メール配信を一つの管理UIで扱えます。",
  },
  {
    icon: Ticket,
    title: "プラン連動のクレジット管理",
    body: "Hobby/Biz/Pro の権限差と、繰越上限付きクレジット残高を同じ設計で管理します。",
  },
  {
    icon: CalendarDays,
    title: "予約・イベント・待機を一元管理",
    body: "定員、待機列、消費タイミング、返却期限まで募集枠ごとに設定できます。",
  },
  {
    icon: ShieldCheck,
    title: "セグメント制御と将来拡張",
    body: "プラン + タグで閲覧制限を設計し、将来の他社展開や商品単位公開にも拡張しやすくしています。",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <header className="flex items-center justify-between rounded-[32px] border border-white/60 bg-white/75 px-5 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-600">
              ログイン
            </Link>
            <Link href="/admin">
              <Button>管理画面を見る</Button>
            </Link>
          </div>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,#0f172a,#1238c6_55%,#2854ff)] px-6 py-16 text-white shadow-[0_30px_120px_rgba(18,56,198,0.28)] md:px-12">
          <div className="absolute inset-y-0 right-0 w-[40%] bg-[radial-gradient(circle_at_center,rgba(246,196,83,0.35),transparent_60%)]" />
          <div className="relative max-w-3xl">
            <Badge tone="accent">DDS会員サイト v1</Badge>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              DDSの受講体験を、
              <br />
              UTAGE級の導線で一つにまとめる。
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
              ホーム、お得情報、イベント、講義予約、教材、FAQ、管理画面を同じ基盤でつなぎ、
              会員の行動導線と運営コストを同時に最適化します。
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/login">
                <Button className="bg-white text-[var(--color-primary)] hover:bg-white/90">
                  会員画面へ
                </Button>
              </Link>
              <Link href="/app">
                <Button variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/14 hover:text-white">
                  デモを見る
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="bg-white/85">
                <div className="inline-flex rounded-2xl bg-[color:rgba(18,56,198,0.08)] p-3 text-[var(--color-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-slate-950">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
              </Card>
            );
          })}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden bg-[linear-gradient(135deg,#f5f1e8,#ffffff)]">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <Badge tone="brand">Member UX</Badge>
                <h2 className="mt-4 font-display text-3xl font-bold text-slate-950">
                  ログイン直後に、やるべきことが迷子にならない。
                </h2>
                <p className="mt-4 text-slate-600">
                  バナー、お知らせ、直近イベント、予約クレジット残高、教材進捗をホームに集約。UTAGEの会員動線を参考にしつつ、情報密度と操作速度を上げています。
                </p>
              </div>
              <div className="grid gap-4">
                <div className="rounded-[26px] bg-[linear-gradient(135deg,#cfe0ff,#ffffff)] p-5">
                  <div className="text-sm font-semibold text-[var(--color-primary)]">今週のおすすめ</div>
                  <div className="mt-2 text-xl font-bold text-slate-950">毎日作業会</div>
                  <div className="mt-3 text-sm text-slate-600">残クレジット、参加URL、進捗導線を一画面に集約</div>
                </div>
                <div className="rounded-[26px] bg-[linear-gradient(135deg,#fff3c6,#ffffff)] p-5">
                  <div className="text-sm font-semibold text-[#9f6f06]">運営向け</div>
                  <div className="mt-2 text-xl font-bold text-slate-950">テーマ設定 + 定型ブロック</div>
                  <div className="mt-3 text-sm text-slate-600">更新担当者が HTML を知らなくても統一された教材ページを追加できます。</div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="bg-[#111b2f] text-white">
            <div className="flex items-center gap-2 text-sm text-white/65">
              <Sparkles className="h-4 w-4" />
              Launch scope
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold">初回から全部盛りの土台を構築</h2>
            <ul className="mt-6 space-y-4 text-sm text-white/78">
              <li>管理画面で会員・クレジット・募集枠・教材・告知を一元管理</li>
              <li>Clerk本番認証 + 未設定時のデモ認証 fallback</li>
              <li>Prisma schema / seed / unit tests まで同梱</li>
            </ul>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]">
              ログイン画面を開く
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </section>
      </div>
    </div>
  );
}
