import type { Metadata } from "next";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { Noto_Sans_JP, Sora } from "next/font/google";

import { ClerkAuthBar } from "@/components/clerk-auth-bar";
import { Providers } from "@/components/providers";
import { env, getAppUrl } from "@/lib/env";
import "./globals.css";

const bodyFont = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DDS Members",
  description: "DDS の会員向け学習・予約・運営を一つにまとめた会員サイト",
  metadataBase: new URL(getAppUrl()),
  openGraph: {
    title: "DDS Members",
    description: "DDS の会員向け学習・予約・運営を一つにまとめた会員サイト",
    url: getAppUrl(),
    siteName: "DDS Members",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DDS Members",
    description: "DDS の会員向け学習・予約・運営を一つにまとめた会員サイト",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  void env;
  return (
    <html lang="ja">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <ClerkProvider
          afterSignOutUrl="/login"
          appearance={{
            variables: {
              colorPrimary: "#1238c6",
              colorText: "#0f172a",
              colorBackground: "#f7f5ef",
            },
          }}
        >
          <ClerkAuthBar />
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
