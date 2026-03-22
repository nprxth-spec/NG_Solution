import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import type { Language } from "@/lib/translations";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NG Solution - Unified Ad Automation",
  description: "Your all-in-one portal for Facebook Ads automation and reporting.",
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const initialLanguage: Language = "th";

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider initialLanguage={initialLanguage}>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
