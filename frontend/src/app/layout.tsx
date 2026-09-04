import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { AppThemeProvider } from "@/components/app-theme-provider";
import { SkipLink } from "@/components/skip-link";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "대시보드 | 우리집 주식대장",
    template: "%s | 우리집 주식대장",
  },
  description: "가족의 국내 주식 매매 기록과 보유 현황을 확인합니다.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  const showDevelopmentTools = process.env.NODE_ENV === "development";

  return (
    <html lang="ko">
      <body>
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <AppThemeProvider>
            <SkipLink />
            <AppHeader />
            <main
              id="main-content"
              tabIndex={-1}
              style={{ minHeight: "calc(100dvh - 64px)", outline: "none" }}
            >
              {children}
            </main>
          </AppThemeProvider>
        </AppRouterCacheProvider>
        {showDevelopmentTools ? (
          <>
            <Script
              src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js"
              strategy="afterInteractive"
            />
            <Script
              src="https://unpkg.com/react-grab@0.1.50/dist/index.global.js"
              strategy="afterInteractive"
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
