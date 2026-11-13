"use client";

import { I18nProvider, RouterProvider, Toast } from "@heroui/react";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={(path) => router.push(path)}>
      <I18nProvider locale="de-DE">
        {children}
        <Toast.Provider placement="bottom end" />
      </I18nProvider>
    </RouterProvider>
  );
}
