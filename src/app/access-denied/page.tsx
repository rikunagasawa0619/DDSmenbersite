import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getThemeSettings } from "@/lib/repository";

type AccessDeniedPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

const messages = {
  suspended: {
    title: "アカウントを利用できません",
    description:
      "この会員アカウントは現在停止中です。契約状況や再開可否について、運営へお問い合わせください。",
  },
  "not-provisioned": {
    title: "会員データの準備が完了していません",
    description:
      "認証は成功していますが、会員サイト側の利用設定がまだ完了していません。招待メールを受け取った運営担当へ連絡してください。",
  },
} as const;

export default async function AccessDeniedPage({
  searchParams,
}: AccessDeniedPageProps) {
  const theme = await getThemeSettings();
  const params = await searchParams;
  const reason = params.reason === "suspended" ? "suspended" : "not-provisioned";
  const message = messages[reason];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl p-8 md:p-10">
        <div className="inline-flex rounded-2xl bg-amber-100 p-4 text-amber-700">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-slate-950">{message.title}</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">{message.description}</p>
        <div className="mt-6 rounded-[24px] border border-black/10 bg-black/[0.02] p-5 text-sm leading-7 text-slate-600">
          お問い合わせ先:{" "}
          <a
            href={`mailto:${theme.supportEmail}`}
            className="font-semibold text-[var(--color-primary)]"
          >
            {theme.supportEmail}
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/login">
            <Button>ログイン画面へ戻る</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">トップへ戻る</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
