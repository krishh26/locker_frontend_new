"use client";

import { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetCoursesQuery } from "@/store/api/course/courseApi";
import { useGetSamplePlansQuery } from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import { Label } from "@/components/ui/label";
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
  setSelectedCourse,
  setSelectedPlan,
} from "@/store/slices/qaSamplePlanSlice";
import { useAppSelector as useAppSelectorType } from "@/store/hooks";

export const CoursePlanSelector = memo(function CoursePlanSelector() {
  const dispatch = useAppDispatch();
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const selectedPlan = useAppSelector(selectSelectedPlan);
  const plans = useAppSelector(selectPlans);

  // Get current user for plans query
  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id as string | number | undefined;

  // RTK Query - Courses
  const { data: coursesData, isLoading: coursesLoading } = useGetCoursesQuery(
    { page: 1, page_size: 500 },
    { skip: false }
  );

  const courses = useMemo(() => {
    if (!coursesData?.data) return [];
    return coursesData.data.map((course) => ({
      id: course.course_id.toString(),
      name: course.course_name || "Untitled Course",
    }));
  }, [coursesData]);

  // RTK Query - Plans (conditional)
  const samplePlanQueryArgs = useMemo(() => {
    if (!selectedCourse || !iqaId) return undefined;
    return { course_id: selectedCourse, iqa_id: iqaId };
  }, [selectedCourse, iqaId]);

  const {
    isFetching: isPlansFetching,
    isLoading: isPlansLoading,
    isError: isPlansError,
  } = useGetSamplePlansQuery(
    samplePlanQueryArgs as { course_id: string; iqa_id: number },
    { skip: !samplePlanQueryArgs }
  );

  const isPlanListLoading = isPlansFetching || isPlansLoading;

  // Plan placeholder text
  const planPlaceholderText = useMemo(() => {
    if (!selectedCourse) return "Select a course first";
    if (isPlanListLoading) return "Loading plans...";
    if (isPlansError) return "Unable to load plans";
    if (!plans.length) return "No plans available";
    return "Select a plan";
  }, [isPlanListLoading, isPlansError, plans.length, selectedCourse]);

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
    (value: string) => {
      const currentValue = selectedCourseRef.current;
      if (value !== currentValue && value !== undefined && value !== "") {
        dispatch(setSelectedCourse(value));
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
        <Label>Select Course</Label>
        <Select
          value={courseValue}
          onValueChange={handleCourseChange}
          disabled={coursesLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Select Plan</Label>
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
        {isPlansError && selectedCourse && (
          <p className="text-sm text-destructive mt-1">
            Unable to load plans for the selected course.
          </p>
        )}
      </div>
    </div>
  );
});
