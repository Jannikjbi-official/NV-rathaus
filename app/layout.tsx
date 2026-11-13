import "@/styles/globals.css";
import type { Metadata } from "next";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="de">
      <body className={`${fontSans.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>{children}</Providers>
      </body>
    </html>
  );
}
