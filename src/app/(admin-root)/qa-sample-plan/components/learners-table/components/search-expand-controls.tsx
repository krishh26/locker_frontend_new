"use client";

import { memo } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectFilterState,
  setSearchText,
} from "@/store/slices/qaSamplePlanSlice";

interface SearchExpandControlsProps {
  expandedRows: Set<number>;
  onToggleAllRowsExpansion: () => void;
  visibleRows: any[];
  isLearnersInFlight: boolean;
}

export const SearchExpandControls = memo(function SearchExpandControls({
  expandedRows,
  onToggleAllRowsExpansion,
  visibleRows,
  isLearnersInFlight,
}: SearchExpandControlsProps) {
  const dispatch = useAppDispatch();
  const filterState = useAppSelector(selectFilterState);
  const { filterApplied, searchText } = filterState;

  if (!filterApplied) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search learners..."
          value={searchText}
          onChange={(e) => dispatch(setSearchText(e.target.value))}
          className="pl-9"
          disabled={isLearnersInFlight}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleAllRowsExpansion}
        disabled={!filterApplied || isLearnersInFlight || !visibleRows || visibleRows.length === 0}
      >
        {visibleRows && expandedRows.size === visibleRows.length && visibleRows.length > 0 ? (
          <>
            <ChevronUp className="mr-2 h-4 w-4" />
            Collapse All
          </>
        ) : (
          <>
            <ChevronDown className="mr-2 h-4 w-4" />
            Expand All
          </>
        )}
      </Button>
    </div>
  );
});
