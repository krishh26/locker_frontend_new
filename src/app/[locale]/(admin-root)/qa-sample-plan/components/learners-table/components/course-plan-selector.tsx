"use client";

import { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  selectSelectedCourse,
  selectSelectedPlan,
  selectPlans,
  selectPlansLoading,
  selectPlansError,
  setSelectedCourse,
  setSelectedPlan,
} from "@/store/slices/qaSamplePlanSlice";
import { CourseAutocomplete } from "@/components/ui/course-autocomplete";

interface CoursePlanSelectorProps {
  disabled?: boolean;
}

export const CoursePlanSelector = memo(function CoursePlanSelector({ disabled = false }: CoursePlanSelectorProps) {
  const t = useTranslations("qaSamplePlan.learnersTable.coursePlanSelector");
  const dispatch = useAppDispatch();
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const selectedPlan = useAppSelector(selectSelectedPlan);
  const plans = useAppSelector(selectPlans);
  const plansLoading = useAppSelector(selectPlansLoading);
  const plansError = useAppSelector(selectPlansError);

  const isPlanListLoading = plansLoading;

  // Plan placeholder text
  const planPlaceholderText = useMemo(() => {
    if (!selectedCourse) return t("placeholders.selectCourseFirst");
    if (isPlanListLoading) return t("placeholders.loadingPlans");
    if (plansError) return t("placeholders.unableLoadPlans");
    if (!plans.length) return t("placeholders.noPlansAvailable");
    return t("placeholders.selectPlan");
  }, [isPlanListLoading, plansError, plans.length, selectedCourse, t]);

  // Use refs to track current values without causing re-renders
  const selectedCourseRef = useRef(selectedCourse);
  const selectedPlanRef = useRef(selectedPlan);

  useEffect(() => {
    selectedCourseRef.current = selectedCourse;
  }, [selectedCourse]);

  useEffect(() => {
    selectedPlanRef.current = selectedPlan;
  }, [selectedPlan]);

  // Use stable values - ensure consistent type (string or undefined, never empty string)
  const courseValue = useMemo(() => {
    return selectedCourse && selectedCourse.trim() ? selectedCourse : undefined;
  }, [selectedCourse]);

  const planValue = useMemo(() => {
    return selectedPlan && selectedPlan.trim() ? selectedPlan : undefined;
  }, [selectedPlan]);

  // Stable handlers - use refs to check current value without creating dependencies
  const handleCourseChange = useCallback(
    (value: string | string[]) => {
      const currentValue = selectedCourseRef.current;
      // Handle single-select: value should be a string, not an array
      const courseId = Array.isArray(value) ? value[0] || "" : value || "";
      if (courseId && courseId !== currentValue && courseId.trim() !== "") {
        dispatch(setSelectedCourse(courseId));
      } else if (!courseId && currentValue) {
        // Handle clearing selection
        dispatch(setSelectedCourse(""));
      }
    },  
    [dispatch]
  );

  const handlePlanChange = useCallback(
    (value: string) => {
      const currentValue = selectedPlanRef.current;
      if (value !== currentValue && value !== undefined && value !== "") {
        dispatch(setSelectedPlan(value));
      }
    },
    [dispatch]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>{t("selectCourse")}</Label>
        <CourseAutocomplete 
          value={courseValue} 
          onValueChange={handleCourseChange} 
          disabled={disabled} 
        />
      </div>

      <div className="space-y-2">
        <Label>{t("selectPlan")}</Label>
        <Select
          value={planValue}
          onValueChange={handlePlanChange}
          disabled={!selectedCourse || isPlanListLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={planPlaceholderText} />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {plansError && selectedCourse && (
          <p className="text-sm text-destructive mt-1">
            {t("errors.unableLoadPlansForCourse")}
          </p>
        )}
      </div>
    </div>
  );
});
