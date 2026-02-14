 
"use client";

import { Fragment } from "react";
import { School, Save, Loader2, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useSaveCourseRiskRatingsMutation, useSaveCourseCommentMutation } from "@/store/api/trainer-risk-rating/trainerRiskRatingApi";
import { toast } from "sonner";
import type { Course, SaveCourseRiskRatingsRequest } from "@/store/api/trainer-risk-rating/types";

interface CoursesTableProps {
  courses: Course[];
  courseRatings: { [key: number]: string };
  comments: { [key: number]: string };
  expandedRow: number | null;
  riskOptions: Array<{ value: string; label: string; color?: string }>;
  onRatingChange: (ratings: { [key: number]: string }) => void;
  onCommentChange: (comments: { [key: number]: string }) => void;
  onExpandedRowChange: (index: number | null) => void;
  trainerId?: number;
  trainerUserId: number;
  onSaveSuccess: () => void;
}

export function CoursesTable({
  courses,
  courseRatings,
  comments,
  expandedRow,
  riskOptions,
  onRatingChange,
  onCommentChange,
  onExpandedRowChange,
  trainerId,
  trainerUserId,
  onSaveSuccess,
}: CoursesTableProps) {
  const [saveCourseRisk, { isLoading: savingCourseRisk }] = useSaveCourseRiskRatingsMutation();
  const [saveCourseComment, { isLoading: savingComment }] = useSaveCourseCommentMutation();

  const handleRatingChange = (courseId: number, value: string) => {
    onRatingChange({ ...courseRatings, [courseId]: value });
  };

  const handleBulkSet = (value: string) => {
    const updated: { [key: number]: string } = {};
    courses.forEach((course) => {
      updated[course.course_id] = value;
    });
    onRatingChange(updated);
    toast.success(`All courses set to ${value} risk level`);
  };

  const handleSaveCourseRatings = async () => {
    const coursesData = Object.entries(courseRatings).map(([id, risk]) => ({
      course_id: Number(id),
      overall_risk_level: risk === "Please select" ? "" : risk,
    }));

    const payload: SaveCourseRiskRatingsRequest = {
      trainer_id: trainerUserId,
      courses: coursesData,
    };

    try {
      await saveCourseRisk({ data: payload }).unwrap();
      toast.success("Course risk ratings saved successfully");
      onSaveSuccess();
    } catch {
      toast.error("Failed to save course risk ratings");
    }
  };

  const handleSaveComment = async (courseId: number, index: number) => {
    if (!trainerId) {
      toast.error("Trainer ID is required");
      return;
    }

    try {
      await saveCourseComment({
        trainerId,
        body: {
          course_comments: {
            course_id: courseId,
            comment: comments[index] || "",
          },
        },
      }).unwrap();

      onExpandedRowChange(null);
      toast.success("Comment saved successfully");
      onSaveSuccess();
    } catch {
      toast.error("Failed to save comment");
    }
  };

  const getRiskColor = (riskLevel: string) => {
    if (riskLevel === "Low") return "bg-accent text-white border-accent";
    if (riskLevel === "Medium") return "bg-secondary text-white border-secondary";
    if (riskLevel === "High") return "bg-destructive text-white border-destructive";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card className="bg-accent border-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5 bg-white/10">
              <School className="h-4 w-4 text-white" />
            </div>
            <CardTitle>Courses ({courses.length})</CardTitle>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkSet("Low")}
              className="border-white/50 text-white hover:bg-white/10"
            >
              Set All Low
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkSet("Medium")}
              className="border-white/50 text-white hover:bg-white/10"
            >
              Set All Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkSet("High")}
              className="border-white/50 text-white hover:bg-white/10"
            >
              Set All High
            </Button>
            <Button
              onClick={handleSaveCourseRatings}
              disabled={savingCourseRisk}
              variant="secondary"
            >
              {savingCourseRisk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Courses
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-white/70 rounded-lg bg-white/10 border border-dashed border-white/20">
            <p>No courses found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead className="w-[30%]">Risk Level</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course, index) => {
                  const currentRating =
                    courseRatings[course.course_id] ??
                    course.risk_rating?.overall_risk_level ??
                    "Please select";
                  const isExpanded = expandedRow === index;

                  return (
                    <Fragment key={course.course_id}>
                      <TableRow>
                        <TableCell className="font-medium">
                          {course.course_name}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentRating}
                            onValueChange={(value) =>
                              handleRatingChange(course.course_id, value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {riskOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{opt.label}</span>
                                    {opt.value !== "Please select" && opt.color && (
                                      <Badge
                                        variant="outline"
                                        className={getRiskColor(opt.label)}
                                      >
                                        {opt.label}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onExpandedRowChange(isExpanded ? null : index)
                            }
                          >
                            {isExpanded ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="p-0">
                          <Collapsible open={isExpanded} onOpenChange={(open) => onExpandedRowChange(open ? index : null)}>
                            <CollapsibleContent>
                              <div className="p-6 bg-white/10 border-t border-white/20">
                                <Label className="text-base font-semibold mb-4 block">
                                  Add Comment for {course.course_name}
                                </Label>
                                <Textarea
                                  value={comments[index] || course.comment || ""}
                                  onChange={(e) =>
                                    onCommentChange({
                                      ...comments,
                                      [index]: e.target.value,
                                    })
                                  }
                                  placeholder="Enter your comment here..."
                                  className="min-h-[100px] mb-4"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() =>
                                      handleSaveComment(course.course_id, index)
                                    }
                                    disabled={savingComment}
                                  >
                                    {savingComment ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Comment
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => onExpandedRowChange(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

