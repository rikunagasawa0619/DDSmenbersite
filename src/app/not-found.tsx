import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-[color:rgba(18,56,198,0.08)] p-4 text-[var(--color-primary)]">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold text-slate-950">
          ページが見つかりません
        </h1>
        <p className="mt-4 text-slate-600">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/">
            <Button>トップに戻る</Button>
          </Link>
          <Link href="/app">
            <Button variant="secondary">会員ホーム</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
