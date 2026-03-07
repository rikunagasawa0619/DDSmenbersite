"use client";

import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";

import { SearchParamToast } from "@/components/ui/search-param-toast";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <SearchParamToast />
      </Suspense>
      {children}
      <Analytics />
    </ToastProvider>
  );
}
