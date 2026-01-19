"use client";

import { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { qaStatuses } from "../../../utils/constants";
import {
  selectFilterState,
  setSelectedStatus,
  setOnlyIncomplete,
  setDateFrom,
  setDateTo,
} from "@/store/slices/qaSamplePlanSlice";

export const FilterControls = memo(function FilterControls() {
  const dispatch = useAppDispatch();
  const filterState = useAppSelector(selectFilterState);
  const { selectedStatus, onlyIncomplete, dateFrom, dateTo } = filterState;

  // Use ref to track current value without causing re-renders
  const selectedStatusRef = useRef(selectedStatus);

  useEffect(() => {
    selectedStatusRef.current = selectedStatus;
  }, [selectedStatus]);

  // Use stable value - ensure consistent type (string or undefined, never empty string)
  const statusValue = useMemo(() => {
    return selectedStatus && selectedStatus.trim() ? selectedStatus : undefined;
  }, [selectedStatus]);

  // Stable handler that doesn't depend on changing values
  const handleStatusChange = useCallback(
    (value: string) => {
      const currentValue = selectedStatusRef.current;
      if (value !== currentValue) {
        dispatch(setSelectedStatus(value));
      }
    },
    [dispatch]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Select QA Status</Label>
        <Select value={statusValue} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {qaStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-8">
        <Checkbox
          id="only-incomplete"
          checked={onlyIncomplete}
          onCheckedChange={(checked) => dispatch(setOnlyIncomplete(checked === true))}
        />
        <Label htmlFor="only-incomplete" className="cursor-pointer">
          Do not show learners with completed course status
        </Label>
      </div>
    </div>
  );
});
