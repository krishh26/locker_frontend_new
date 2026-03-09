import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'es', 'zh', 'fr', 'ar', 'pt', 'hi'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request, with fallback to default
  let locale = await requestLocale;

  // Validate locale - if invalid, use default locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale: locale as Locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
