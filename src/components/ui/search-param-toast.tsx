"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/ui/toast";

export function SearchParamToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const message = searchParams.get("toast");
    const type = searchParams.get("toastType");

    if (!message) {
      handled.current = null;
      return;
    }

    const key = `${message}:${type ?? "success"}`;
    if (handled.current === key) {
      return;
    }

    handled.current = key;
    toast(message, type === "error" ? "error" : "success");

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");
    nextParams.delete("toastType");
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams, toast]);

  return null;
}
