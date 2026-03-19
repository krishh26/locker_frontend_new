import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeInitializer } from "@/components/theme-initializer";
import { Toaster } from "@/components/ui/sonner";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { ReduxProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: "Locker",
  description: "Locker is a platform for learning and development",
};

// Avoid prerendering [locale] to work around Next.js client reference manifest bug
// (Invariant: The client reference manifest for route "/[locale]" does not exist)
export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Locale validation is handled by middleware

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Note: Root layout handles <html> and <body>
  // We just wrap the content with providers
  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider defaultTheme="light" storageKey="nextjs-ui-theme">
        <ThemeInitializer />
        <ReduxProvider>
          <SidebarConfigProvider>
            {children}
            <Toaster />
          </SidebarConfigProvider>
        </ReduxProvider>
      </ThemeProvider>
      <script
        dangerouslySetInnerHTML={{
          __html: `if(typeof document !== 'undefined') document.documentElement.lang = '${locale}';`,
        }}
      />
    </NextIntlClientProvider>
  );
}
