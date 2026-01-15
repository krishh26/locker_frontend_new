"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCoursesQuery } from "@/store/api/course/courseApi";
import {
  useGetProgressExclusionQuery,
  useUpdateProgressExclusionMutation,
} from "@/store/api/progress-exclusion/progressExclusionApi";
import type { Course } from "@/store/api/course/types";
import { toast } from "sonner";

// Training status list
const trainingStatuses = [
  "In Training",
  "IQA Approved",
  "Completed",
  "Certificated",
  "Training Suspended",
  "Transferred",
  "Early Leaver",
  "Exempt",
  "Awaiting Induction",
];

export function ProgressExclusionForm() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [excludedStatuses, setExcludedStatuses] = useState<Set<string>>(new Set());

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading } = useGetCoursesQuery({
    page: 1,
    page_size: 1000, // Get all courses
  });

  // Fetch exclusion settings when course is selected
  const {
    data: exclusionData,
    isLoading: exclusionLoading,
    error: exclusionError,
  } = useGetProgressExclusionQuery(Number(selectedCourseId), {
    skip: !selectedCourseId || selectedCourseId === "",
  });

  const [updateProgressExclusion, { isLoading: isSubmitting }] =
    useUpdateProgressExclusionMutation();

  const courses = coursesData?.data || [];

  // Update excluded statuses when exclusion data changes
  useEffect(() => {
    if (exclusionData?.data && exclusionData.data.excluded_statuses) {
      setExcludedStatuses(new Set(exclusionData.data.excluded_statuses));
    } else if (selectedCourseId && !exclusionLoading && exclusionData && !exclusionData.data) {
      // Default excluded statuses if no data exists (API returned success but no data)
      setExcludedStatuses(
        new Set(["Completed", "Certificated", "Transferred", "Early Leaver"])
      );
    }
  }, [exclusionData, selectedCourseId, exclusionLoading]);

  // Handle checkbox change
  const handleCheckboxChange = (status: string) => {
    setExcludedStatuses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    try {
      await updateProgressExclusion({
        course_id: Number(selectedCourseId),
        excluded_statuses: Array.from(excludedStatuses),
      }).unwrap();

      toast.success("Progress exclusion settings updated successfully");
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string }; message?: string })?.data
          ?.error ||
        (error as { data?: { error?: string; message?: string }; message?: string })?.data
          ?.message ||
        (error as { data?: { error?: string; message?: string }; message?: string })?.message ||
        "Failed to update progress exclusion settings";
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exclude From Overall Progress</CardTitle>
        <CardDescription>
          Select a course and choose which training statuses should be excluded from overall
          progress tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Select a course and choose which training statuses should be excluded from overall
            progress tracking.
          </AlertDescription>
        </Alert>

        {/* Course Selection */}
        <div className="space-y-2">
          <Label htmlFor="course-select">
            Select Course <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCourseId}
            onValueChange={(value) => {
              setSelectedCourseId(value);
              setExcludedStatuses(new Set()); // Reset when course changes
            }}
            disabled={coursesLoading}
          >
            <SelectTrigger id="course-select" className="w-full">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course: Course) => (
                <SelectItem key={course.course_id} value={course.course_id.toString()}>
                  {course.course_name} {course.course_code ? `(${course.course_code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status List Table */}
        {selectedCourseId && (
          <>
            {exclusionLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 9 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : exclusionError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load exclusion settings. Please try again.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status Changed To</TableHead>
                        <TableHead className="text-center">Exclude From Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainingStatuses.map((status, index) => (
                        <TableRow
                          key={status}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}
                        >
                          <TableCell className="font-medium">{status}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={excludedStatuses.has(status)}
                              onCheckedChange={() => handleCheckboxChange(status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

