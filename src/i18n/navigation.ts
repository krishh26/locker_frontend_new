import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

// Define routing configuration
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'never'
});

// Create navigation helpers from next-intl
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

