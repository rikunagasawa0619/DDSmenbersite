import type { Metadata } from "next";
import { IBM_Plex_Sans_JP, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";
import { ThemeScript } from "@/components/providers/theme-script";
import { env, getAppUrl } from "@/lib/env";
import "./globals.css";

const bodyFont = IBM_Plex_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const displayFont = JetBrains_Mono({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["100", "400", "800"],
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
        <ThemeScript />
        <a href="#main-content" className="dds-skip-link">
          コンテンツへスキップ
        </a>
        <Providers>
          <ServiceWorkerRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
