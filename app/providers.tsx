"use client";

import { I18nProvider, RouterProvider, Toast } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    // HeroUI liest sowohl die Klasse (.dark) als auch data-theme.
    <ThemeProvider disableTransitionOnChange enableSystem attribute={["class", "data-theme"]} defaultTheme="system">
      <RouterProvider navigate={(path) => router.push(path)}>
        <I18nProvider locale="de-DE">
          {children}
          <Toast.Provider placement="bottom end" />
        </I18nProvider>
      </RouterProvider>
    </ThemeProvider>
  );
}
