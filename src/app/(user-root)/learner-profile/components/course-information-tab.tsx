"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LearnerData } from "@/store/api/learner/types";
import { cn } from "@/lib/utils";

interface CourseInformationTabProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function CourseInformationTab({ learner, canEdit = false }: CourseInformationTabProps) {
  const courses = learner.course || [];

  const formatDate = (date: string | undefined | null): string => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      return d.toLocaleDateString();
    } catch {
      return date;
    }
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return "secondary";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("completed") || statusLower.includes("certificated")) {
      return "default";
    }
    if (statusLower.includes("suspended") || statusLower.includes("leaver")) {
      return "destructive";
    }
    return "secondary";
  };

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No course information available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Course Code</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Main Course</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.user_course_id}>
                  <TableCell className="font-medium">
                    {course.course?.course_name || "-"}
                  </TableCell>
                  <TableCell>{course.course?.course_code || "-"}</TableCell>
                  <TableCell>{course.course?.level || "-"}</TableCell>
                  <TableCell>{course.course?.sector || "-"}</TableCell>
                  <TableCell>{formatDate(course.start_date)}</TableCell>
                  <TableCell>{formatDate(course.end_date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(course.course_status)}
                      className={cn(
                        course.course_status === "Completed" ||
                          course.course_status === "Certificated"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : course.course_status === "Early Leaver" ||
                            course.course_status === "Training Suspended"
                          ? "bg-red-100 text-red-800 hover:bg-red-100"
                          : ""
                      )}
                    >
                      {course.course_status || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {course.is_main_course ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Additional Course Details */}
        {courses.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.user_course_id} className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {course.course?.course_name || "Course"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Credits:</span>
                    <span>{course.course?.total_credits || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guided Learning Hours:</span>
                    <span>{course.course?.guided_learning_hours || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course Type:</span>
                    <span>{course.course?.course_type || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Core Type:</span>
                    <span>{course.course?.course_core_type || "-"}</span>
                  </div>
                  {course.course?.recommended_minimum_age && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Age:</span>
                      <span>{course.course.recommended_minimum_age}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

