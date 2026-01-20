"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileQuestion,
  TrendingUp,
  Highlighter,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useUpdateCourseUnitSkillMutation } from "@/store/api/skills-scan/skillsScanApi";
import {
  selectSelectedCourse,
  selectCourseData,
  selectSelectedUnit,
  setSelectedUnit,
  setCourseData,
  updateCourseDataUnits,
} from "@/store/slices/skillsScanSlice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CourseUnit, SubUnit } from "@/store/api/skills-scan/types";

interface SkillsScanTnaQuestionnaireProps {
  onTabChange: (tab: string) => void;
}

const ratingOptions = [
  { value: 1, label: "😖 - Never" },
  { value: 2, label: "☹️ - Not sure" },
  { value: 3, label: "🙂 - Sometimes" },
  { value: 4, label: "😁 - Always" },
];

const reviewPhases = [
  { key: "induction", label: "Induction" },
  { key: "first", label: "First Review" },
  { key: "second", label: "Second Review" },
  { key: "third", label: "Third Review" },
];

export function SkillsScanTnaQuestionnaire({
  onTabChange,
}: SkillsScanTnaQuestionnaireProps) {
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";
  const dispatch = useAppDispatch();
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const courseData = useAppSelector(selectCourseData);
  const selectedUnit = useAppSelector(selectSelectedUnit);
  const [highlightBlanks, setHighlightBlanks] = useState(false);
  // Local state to track unit changes before saving
  const [localUnits, setLocalUnits] = useState<CourseUnit[]>([]);

  const [updateCourseUnitSkill, { isLoading: isSaving }] =
    useUpdateCourseUnitSkillMutation();

  // Note: courseData is managed by tna-units component, so we don't need to set it here
  // But we can still use it from Redux

  // Handle both response structures: with course wrapper or direct units
  const courseUnits = useMemo(() => {
    return courseData?.course?.units || courseData?.units || [];
  }, [courseData?.course?.units, courseData?.units]);

  const courseCoreType = courseData?.course?.course_core_type || courseData?.course_core_type;
  const isStandardType = courseCoreType === "Standard";

  // Initialize localUnits when courseData changes (new course selected or data refreshed)
  useEffect(() => {
    if (courseUnits.length > 0) {
      setLocalUnits(courseUnits);
    } else {
      setLocalUnits([]);
    }
  }, [courseUnits]);

  // Use localUnits if available (has unsaved changes), otherwise use courseUnits from Redux
  const units = localUnits.length > 0 ? localUnits : courseUnits;

  const currentIndex = selectedUnit
    ? units.findIndex((u: CourseUnit) => u.id === selectedUnit.id)
    : -1;

  const totalTopics = units.length;
  const completedTopics = units.filter((unit: CourseUnit) => {
    // For Standard courses: if unit type is "Duty", check subUnits; otherwise check unit's quarter_review
    if (isStandardType && unit.type !== "Duty") {
      return (
        unit.quarter_review?.induction &&
        unit.quarter_review?.first &&
        unit.quarter_review?.second &&
        unit.quarter_review?.third
      );
    }
    // For Qualification courses or Duty units in Standard courses, check subUnits
    return unit.subUnit?.every((sub) =>
      sub.quarter_review?.induction &&
      sub.quarter_review?.first &&
      sub.quarter_review?.second &&
      sub.quarter_review?.third
    );
  }).length;

  const handleSelectChange = (
    subUnitId: string,
    reviewKey: string,
    value: string
  ) => {
    if (!selectedUnit || !courseData) return;

    const updatedUnits = units.map((unit: CourseUnit) => {
      if (unit.id === selectedUnit.id) {
        // For Standard courses: if unit type is NOT "Duty", update unit's quarter_review directly
        if (isStandardType && unit.type !== "Duty") {
          return {
            ...unit,
            quarter_review: {
              ...unit.quarter_review,
              [reviewKey]: parseInt(value),
            },
          };
        }
        // For Qualification courses or Duty units in Standard courses, update subUnit
        const updatedSubUnits = unit.subUnit?.map((sub: SubUnit) => {
          if (sub.id === subUnitId) {
            return {
              ...sub,
              quarter_review: {
                ...sub.quarter_review,
                [reviewKey]: parseInt(value),
              },
            };
          }
          return sub;
        });
        return { ...unit, subUnit: updatedSubUnits };
      }
      return unit;
    });
    console.log("🚀 ~ handleSelectChange ~ updatedUnits:", updatedUnits)

    // Update local state only (not Redux) - will be saved to Redux after successful API call
    setLocalUnits(updatedUnits);

    const updatedSelectedUnit = updatedUnits.find(
      (u: CourseUnit) => u.id === selectedUnit.id
    );
    if (updatedSelectedUnit) {
      dispatch(setSelectedUnit(updatedSelectedUnit));
    }
  };

  const handleSave = async () => {
    if (!courseData || !selectedCourse) return;

    try {
      // Note: userCourseId should come from selectedCourse or courseData
      const userCourseId = courseData.user_course_id
        ? String(courseData.user_course_id)
        : selectedCourse.user_course_id
          ? String(selectedCourse.user_course_id)
          : "";

      // Prepare the request data structure with complete course data
      // Include all course fields and updated units from local state
      const requestData = {
        course: {
          ...(courseData.course || {}),
          units: localUnits.length > 0 ? localUnits : units, // Use localUnits if available, fallback to units
        },
      };

      await updateCourseUnitSkill({
        userCourseId,
        data: requestData,
      }).unwrap();

      // Update Redux state only after successful API call
      dispatch(updateCourseDataUnits(localUnits.length > 0 ? localUnits : units));

      // Update courseData with the complete response if needed
      if (courseData.course) {
        dispatch(setCourseData({
          ...courseData,
          course: {
            ...courseData.course,
            units: localUnits.length > 0 ? localUnits : units,
          },
        }));
      }

      toast.success("Progress saved successfully");
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && typeof (error as { data?: { message?: string } }).data?.message === 'string'
        ? (error as { data: { message: string } }).data.message
        : "Failed to save progress";
      toast.error(errorMessage);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      dispatch(setSelectedUnit(units[currentIndex - 1]));
    }
  };

  const handleNext = () => {
    if (currentIndex < totalTopics - 1) {
      dispatch(setSelectedUnit(units[currentIndex + 1]));
    }
  };

  if (!selectedCourse) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <FileQuestion className="mb-4 size-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Course Selected</h3>
          <p className="text-muted-foreground text-sm">
            Please select a course from the &quot;Choose TNA Units&quot; tab
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if courseData is loading (managed by tna-units component)
  const isLoading = !courseData && selectedCourse;

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="text-center">Loading course data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileQuestion className="size-6 text-primary" />
              <CardTitle>TNA Questionnaire</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="size-3" />
                {completedTopics}/{totalTopics} Topics Completed
              </Badge>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="highlight-blanks"
                  checked={highlightBlanks}
                  onCheckedChange={(checked) =>
                    setHighlightBlanks(checked === true)
                  }
                />
                  <Label
                    htmlFor="highlight-blanks"
                    className="flex cursor-pointer items-center gap-1 text-sm"
                  >
                    <Highlighter className="size-4" />
                    Highlight Blanks
                  </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator />
      </Card>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Topics Sidebar */}
        <Card className="w-full border shadow-sm lg:w-[300px] lg:sticky lg:top-6 lg:h-fit">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-base">Assessment Topics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {units.map((unit: CourseUnit, index: number) => (
                <div
                  key={unit.id}
                  onClick={() => dispatch(setSelectedUnit(unit))}
                  className={cn(
                    "cursor-pointer border-b p-4 transition-colors hover:bg-muted",
                    selectedUnit?.id === unit.id &&
                      "bg-primary/10 border-l-4 border-l-primary"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={selectedUnit?.id === unit.id ? "default" : "secondary"}
                      className="min-w-[24px]"
                    >
                      {index + 1}
                    </Badge>
                    <span
                      className={cn(
                        "text-sm",
                        selectedUnit?.id === unit.id && "font-semibold text-primary"
                      )}
                    >
                      {unit.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Assessment Area */}
        <div className="flex-1">
          {selectedUnit ? (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>
                  {selectedUnit.title}
                </CardTitle>
                <p className="text-sm">
                  Rate your skills for each competency area
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[250px] font-semibold">
                          Skill To Be Demonstrated
                        </TableHead>
                        {reviewPhases.map((phase) => (
                          <TableHead
                            key={phase.key}
                            className="text-center font-semibold"
                          >
                            {phase.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* For Standard courses: if unit type is NOT "Duty", show unit directly */}
                      {isStandardType && selectedUnit.type !== "Duty" ? (
                        <TableRow key={selectedUnit.id}>
                          <TableCell className="font-medium">
                            {selectedUnit.title}
                          </TableCell>
                          {reviewPhases.map((phase) => {
                            const reviewValue = phase.key === 'induction' ? selectedUnit.quarter_review?.induction :
                              phase.key === 'first' ? selectedUnit.quarter_review?.first :
                              phase.key === 'second' ? selectedUnit.quarter_review?.second :
                              selectedUnit.quarter_review?.third;
                            const hasValue = !!reviewValue;
                            return (
                              <TableCell
                                key={phase.key}
                                className={cn(
                                  "text-center",
                                  highlightBlanks &&
                                    !hasValue &&
                                    "bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-500"
                                )}
                              >
                                <Select
                                  value={reviewValue?.toString() || ""}
                                  onValueChange={(value) =>
                                    handleSelectChange(selectedUnit.id as string, phase.key, value)
                                  }
                                  disabled={isEmployer}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select rating" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ratingOptions.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value.toString()}
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ) : (
                        /* For Qualification courses or Duty units in Standard courses, show subUnits */
                        selectedUnit.subUnit && selectedUnit.subUnit.length > 0 ? (
                          selectedUnit.subUnit.map((subUnit: SubUnit) => (
                            <TableRow key={subUnit.id}>
                              <TableCell className="font-medium">
                                {subUnit.title}
                              </TableCell>
                              {reviewPhases.map((phase) => {
                                const reviewValue = phase.key === 'induction' ? subUnit.quarter_review?.induction :
                                  phase.key === 'first' ? subUnit.quarter_review?.first :
                                  phase.key === 'second' ? subUnit.quarter_review?.second :
                                  subUnit.quarter_review?.third;
                                const hasValue = !!reviewValue;
                                return (
                                  <TableCell
                                    key={phase.key}
                                    className={cn(
                                      "text-center",
                                      highlightBlanks &&
                                        !hasValue &&
                                        "bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-500"
                                    )}
                                  >
                                    <Select
                                      value={reviewValue?.toString() || ""}
                                      onValueChange={(value) =>
                                        handleSelectChange(subUnit.id, phase.key, value)
                                      }
                                      disabled={isEmployer}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select rating" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {ratingOptions.map((opt) => (
                                          <SelectItem
                                            key={opt.value}
                                            value={opt.value.toString()}
                                          >
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={reviewPhases.length + 1} className="text-center text-muted-foreground py-8">
                              No skills to assess for this unit
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileQuestion className="mb-4 size-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Topic Selected</h3>
                <p className="text-muted-foreground text-sm">
                  Please select a topic from the sidebar to begin assessment
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navigation Controls */}
          <Card className="mt-6 border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentIndex === totalTopics - 1}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="default"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="size-4" />
                    {isSaving ? "Saving..." : "Save Progress"}
                  </Button>
                  <Button
                    onClick={() => onTabChange("results")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="size-4" />
                    View Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

