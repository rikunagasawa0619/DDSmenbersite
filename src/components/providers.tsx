"use client";

import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";

import { SearchParamToast } from "@/components/ui/search-param-toast";
import { isClerkConfigured } from "@/lib/config";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <ToastProvider>
      <Suspense fallback={null}>
        <SearchParamToast />
      </Suspense>
      {children}
      <Analytics />
    </ToastProvider>
  );

  if (!isClerkConfigured) {
    return content;
  }

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1238c6",
          colorText: "#0f172a",
          colorBackground: "#f7f5ef",
        },
      }}
    >
      {content}
    </ClerkProvider>
  );
}
