import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { ReduxProvider } from "@/store/provider";
import { locales } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Locker",
  description: "Locker is a platform for learning and development",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Locale validation is handled by generateStaticParams and middleware
  // No need to call notFound() here as layouts cannot use it

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Note: Root layout handles <html> and <body>
  // We just wrap the content with providers
  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider defaultTheme="light" storageKey="nextjs-ui-theme">
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
