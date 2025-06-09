"use client";

import { SessionProvider } from "@/components/SessionProvider";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="light" themes={['light', 'dark', 'purple-dark']}>
        <SessionProvider>
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
            {children}
          </div>
        </SessionProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
} 