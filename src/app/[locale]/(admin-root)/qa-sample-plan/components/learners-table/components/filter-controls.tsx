"use client";

import { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
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
} from "@/store/slices/qaSamplePlanSlice";

export const FilterControls = memo(function FilterControls() {
  const t = useTranslations("qaSamplePlan.learnersTable.filterControls");
  const dispatch = useAppDispatch();
  const filterState = useAppSelector(selectFilterState);
  const { selectedStatus, onlyIncomplete } = filterState;

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
        <Label>{t("selectQaStatus")}</Label>
        <Select value={statusValue} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("selectStatusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {qaStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`qaStatus.${status}`)}
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
          {t("hideCompletedLearners")}
        </Label>
      </div>
    </div>
  );
});
