"use client";

import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { locales, type Locale } from "@/i18n/config";

const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
  fr: "Français",
  ar: "العربية",
  pt: "Português",
  hi: "हिन्दी",
};

const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  zh: "🇨🇳",
  fr: "🇫🇷",
  ar: "🇸🇦",
  pt: "🇵🇹",
  hi: "🇮🇳",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;

  const switchLocale = (newLocale: Locale) => {
    // Get current full pathname from window (includes locale)
    const currentPath = window.location.pathname;
    // Extract path without locale
    const pathWithoutLocale = currentPath.replace(/^\/[^/]+/, '') || '/';
    // Navigate to the same path with new locale
    const newPath = `/${newLocale}${pathWithoutLocale}${window.location.search}`;
    window.location.href = newPath;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={locale === loc ? "bg-accent" : ""}
          >
            <span className="mr-2">{localeFlags[loc]}</span>
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
