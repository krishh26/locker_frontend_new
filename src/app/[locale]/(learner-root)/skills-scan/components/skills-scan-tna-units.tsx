"use client";

import { useEffect } from "react";
import { School, TrendingUp, ArrowRight, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetCourseDetailsQuery } from "@/store/api/skills-scan/skillsScanApi";
import { selectCourses } from "@/store/slices/authSlice";
import {
  setSelectedCourse,
  setCourseData,
  selectSelectedCourse,
  selectCourseData,
} from "@/store/slices/skillsScanSlice";

// CourseOption type matches LearnerCourse structure
type CourseOption = {
  course: {
    course_id: string | number;
    course_name: string;
  };
  start_date: string;
  end_date: string;
  user_course_id?: number;
};

interface SkillsScanTnaUnitsProps {
  onTabChange: (tab: string) => void;
}

const getQuarterlyProgress = (start: Date, end: Date) => {
  const result: Array<{ date: string; isDisabled: boolean }> = [];
  const current = new Date(start);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  while (current <= end) {
    const month = current.getMonth();
    const year = current.getFullYear();
    const monthName = current.toLocaleString("default", { month: "long" });

    const isFuture =
      year > currentYear || (year === currentYear && month > currentMonth);

    result.push({
      date: `${monthName}-${year}`,
      isDisabled: isFuture,
    });

    current.setMonth(current.getMonth() + 3);
  }

  return result;
};

export function SkillsScanTnaUnits({
  onTabChange,
}: SkillsScanTnaUnitsProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const courses = useAppSelector(selectCourses);
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const courseData = useAppSelector(selectCourseData);

  const learnerId = String(user?.learner_id) || "";
  const courseId = selectedCourse?.course?.course_id
    ? String(selectedCourse.course.course_id)
    : "";

  const { data, isLoading } = useGetCourseDetailsQuery(
    { learner_id: learnerId as string, course_id: courseId as string },
    { skip: !courseId || !learnerId }
  );

  // Convert courses from auth slice to CourseOption format
  const availableCourses: CourseOption[] = (courses || []).map((c) => ({
    course: {
      course_id: String(c.course.course_id),
      course_name: c.course.course_name,
    },
    start_date: c.start_date,
    end_date: c.end_date,
    user_course_id: c.user_course_id,
  }));

  const handleCourseChange = (value: string) => {
    if (!value) {
      dispatch(setSelectedCourse(null));
      return;
    }

    const course = availableCourses.find(
      (c) => String(c.course.course_id) === value
    );

    if (course) {
      const progressByDate = getQuarterlyProgress(
        new Date(course.start_date),
        new Date(course.end_date)
      );

      const courseWithProgress = {
        ...course,
        progressByDate,
      };

      dispatch(setSelectedCourse(courseWithProgress));
    } else {
      dispatch(setSelectedCourse(null));
    }
  };

  // Update courseData when API data changes - store complete API response data
  useEffect(() => {
    if (data?.data) {
      // Store the complete data object from API response
      dispatch(setCourseData(data.data));
    } else {
      dispatch(setCourseData(null));
    }
  }, [data, dispatch]);

  // Reset courseData when selectedCourse is cleared
  useEffect(() => {
    if (!selectedCourse) {
      dispatch(setCourseData(null));
    }
  }, [selectedCourse, dispatch]);

  // Handle both response structures: with course wrapper or direct units
  const units = courseData?.course?.units || courseData?.units || [];
  const courseCoreType = courseData?.course?.course_core_type || courseData?.course_core_type;
  const isStandardType = courseCoreType === "Standard";

  return (
    <div className="space-y-6">
      {/* Course Selection Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <School className="size-6 text-primary" />
            <CardTitle>Choose Training Course</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="text-sm font-medium sm:min-w-fit">
              Select Course:
            </label>
            <Select
              value={
                selectedCourse?.course?.course_id
                  ? String(selectedCourse.course.course_id)
                  : ""
              }
              onValueChange={handleCourseChange}
            >
              <SelectTrigger className="w-full sm:max-w-md">
                <SelectValue placeholder="Select a course to begin..." />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.length > 0 ? (
                  availableCourses.map((course) => (
                    <SelectItem
                      key={course.course.course_id}
                      value={String(course.course.course_id)}
                    >
                      {course.course.course_name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No courses available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Units Table */}
      {isLoading ? (
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ) : selectedCourse && units.length > 0 ? (
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-5 text-primary" />
                <CardTitle>Course Units</CardTitle>
              </div>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="size-3" />
                {units.length} Units Available
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary text-white">
                    <TableHead className="font-semibold">
                      {isStandardType ? "Standards" : "Standard Units"}
                    </TableHead>
                    {!isStandardType && (
                      <>
                        <TableHead className="text-center font-semibold">Hours</TableHead>
                        <TableHead className="text-center font-semibold">Credits</TableHead>
                        <TableHead className="text-center font-semibold">Level</TableHead>
                      </>
                    )}
                    {isStandardType && (
                      <>
                        <TableHead className="text-center font-semibold">Code</TableHead>
                        <TableHead className="text-center font-semibold">Type</TableHead>
                        <TableHead className="text-center font-semibold">Mandatory</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">
                        {unit.title}
                      </TableCell>
                      {!isStandardType ? (
                        <>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-primary text-white">
                              {unit.glh ?? "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-accent text-white">
                              {unit.credit_value ?? "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-secondary text-white">
                              {unit.level ? `Level ${unit.level}` : "N/A"}
                            </Badge>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-primary text-white">
                              {unit.code || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-accent text-white">
                              {unit.type || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={unit.mandatory ? "bg-secondary text-white" : "bg-muted text-muted-foreground"}>
                              {unit.mandatory ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <School className="mb-4 size-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Units Found</h3>
            <p className="text-muted-foreground text-sm">
              Please select a course to view available units
            </p>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {selectedCourse && units.length > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-center">
              <Button
                onClick={() => onTabChange("questionnaire")}
                size="lg"
                className="gap-2"
              >
                Continue to Questionnaire
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

