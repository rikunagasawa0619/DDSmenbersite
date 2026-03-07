"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-red-50 p-4 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold text-slate-950">
          エラーが発生しました
        </h1>
        <p className="mt-4 text-slate-600">
          予期しないエラーが発生しました。しばらくしてからもう一度お試しください。
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-slate-400">参照ID: {error.digest}</p>
        ) : null}
        <div className="mt-8">
          <Button onClick={reset}>もう一度試す</Button>
        </div>
      </div>
    </div>
  );
}
