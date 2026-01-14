import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { inter } from "@/lib/fonts";
import { ReduxProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: "Locker",
  description: "Locker is a platform for learning and development",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light" storageKey="nextjs-ui-theme">
          <ReduxProvider>
            <SidebarConfigProvider>
              {children}
              <Toaster />
            </SidebarConfigProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
