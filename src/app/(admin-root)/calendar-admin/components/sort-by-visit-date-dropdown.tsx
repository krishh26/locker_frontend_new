"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";

interface SortByVisitDateDropdownProps {
  value?: "asc" | "desc";
  onChange: (value: "asc" | "desc") => void;
}

export function SortByVisitDateDropdown({
  value,
  onChange,
}: SortByVisitDateDropdownProps) {
  const handleSelect = (newValue: "asc" | "desc") => {
    onChange(newValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-[190px] justify-between">
          {value === "asc"
            ? "Oldest First"
            : value === "desc"
            ? "Latest First"
            : "Sort by Visit Date"}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleSelect("desc")}>
          <ArrowDown className="h-4 w-4 mr-2" />
          Latest First
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("asc")}>
          <ArrowUp className="h-4 w-4 mr-2" />
          Oldest First
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

