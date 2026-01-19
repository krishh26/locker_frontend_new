/**
 * Custom hook for easy access to translations
 * This is a convenience wrapper around next-intl's useTranslations
 */
import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}
