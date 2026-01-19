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
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ar: "العربية",
  hi: "हिन्दी",
  zh: "中文",
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
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
