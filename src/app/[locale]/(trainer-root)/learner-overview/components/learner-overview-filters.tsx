"use client";

import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface LearnerOverviewFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
}

export function LearnerOverviewFilters({
  searchQuery,
  onSearchChange,
  isSearching,
}: LearnerOverviewFiltersProps) {
  const t = useTranslations("learnerOverview");

  return (
    <div className="space-y-2 sm:w-1/4 w-full">
      <label className="text-sm font-medium">{t("filters.searchLabel")}</label>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("filters.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-primary" />
        )}
        {searchQuery && !isSearching && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

