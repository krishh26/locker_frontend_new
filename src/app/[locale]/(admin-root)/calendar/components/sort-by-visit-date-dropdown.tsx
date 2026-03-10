"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface SortByVisitDateDropdownProps {
  value?: "asc" | "desc";
  onChange: (value: "asc" | "desc") => void;
}

export function SortByVisitDateDropdown({
  value,
  onChange,
}: SortByVisitDateDropdownProps) {
  const t = useTranslations("calendar");

  const handleSelect = (newValue: "asc" | "desc") => {
    onChange(newValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-[190px] justify-between">
          {value === "asc"
            ? t("sort.oldestFirst")
            : value === "desc"
            ? t("sort.latestFirst")
            : t("sort.byVisitDate")}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleSelect("desc")}>
          <ArrowDown className="h-4 w-4 mr-2" />
          {t("sort.latestFirst")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("asc")}>
          <ArrowUp className="h-4 w-4 mr-2" />
          {t("sort.oldestFirst")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

