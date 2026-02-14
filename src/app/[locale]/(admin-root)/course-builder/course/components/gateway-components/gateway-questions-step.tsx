/**
 * GatewayQuestionsStep Component
 * 
 * Step component for managing questions for Gateway courses
 * Handles Course Details, Checklist Questions, and Assigned Standards
 */

"use client";

import { useEffect, useState } from "react";
import { useFieldArray, Controller, useWatch, Control, UseFormSetValue, FieldErrors, UseFormTrigger } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type { CourseFormData, CourseCoreType } from "@/store/api/course/types";
import { useGetStandardCoursesQuery } from "@/store/api/course/courseApi";
import { CourseTransferList } from "./course-transfer-list";
import { cn } from "@/lib/utils";

interface GatewayQuestionsStepProps {
  courseId?: string | number | null;
  courseCoreType: CourseCoreType;
  control: Control<CourseFormData>;
  setValue: UseFormSetValue<CourseFormData>;
  errors: FieldErrors<CourseFormData>;
  trigger: UseFormTrigger<CourseFormData>;
  edit?: "create" | "edit" | "view";
}

interface QuestionItem {
  id: string | number;
  question: string;
  evidenceRequired: boolean;
  isDropdown: boolean;
  dropdownOptions: string;
}

interface CourseItem {
  id: string;
  name: string;
}

export function GatewayQuestionsStep({
  control,
  setValue,
  errors,
  trigger,
  edit = "create",
}: GatewayQuestionsStepProps) {
  const isViewMode = edit === "view";
  const [removingQuestionId, setRemovingQuestionId] = useState<string | number | null>(null);

  // Questions management
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "questions",
  });

  const questions = useWatch({
    control,
    name: "questions",
    defaultValue: [],
  });

  // Fetch active standard courses
  const { data: standardCoursesData, isLoading: loadingCourses } = useGetStandardCoursesQuery();

  // Transform API response to CourseItem format
  const allStandardCourses: CourseItem[] = standardCoursesData?.data?.map((course) => ({
    id: course.course_id.toString(),
    name: `${course.course_name} (${course.course_code})`,
  })) || [];

  // Show validation errors via toast
  useEffect(() => {
    if (errors?.questions && typeof errors.questions === "object" && "message" in errors.questions) {
      toast.error(errors.questions.message as string);
    }
    if (
      errors?.assigned_standards &&
      typeof errors.assigned_standards === "object" &&
      "message" in errors.assigned_standards
    ) {
      toast.error(errors.assigned_standards.message as string);
    }
  }, [errors?.questions, errors?.assigned_standards]);

  const handleAddQuestion = () => {
    const newQuestion: QuestionItem = {
      id: Date.now(),
      question: "",
      evidenceRequired: false,
      isDropdown: true, // Default to true
      dropdownOptions: "",
    };
    appendQuestion(newQuestion);
  };

  const handleRemoveQuestion = async (index: number, questionId: string | number) => {
    setRemovingQuestionId(questionId);
    try {
      // Simulate async operation (in case of API call in future)
      await new Promise((resolve) => setTimeout(resolve, 100));
      removeQuestion(index);
      toast.success("Question removed successfully");
    } catch {
      toast.error("Failed to remove question");
    } finally {
      setRemovingQuestionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="course_name">
                Course Name <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="course_name"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <div>
                    <Input
                      {...field}
                      id="course_name"
                      placeholder="Enter Course Name"
                      disabled={isViewMode}
                      className={cn(error && "border-destructive")}
                    />
                    {error && (
                      <p className="text-sm text-destructive mt-1">{error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course_code">
                Course Code <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="course_code"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <div>
                    <Input
                      {...field}
                      id="course_code"
                      placeholder="Enter Course Code"
                      disabled={isViewMode}
                      className={cn(error && "border-destructive")}
                    />
                    {error && (
                      <p className="text-sm text-destructive mt-1">{error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Active Course (Yes or No)</Label>
              <Controller
                name="active"
                control={control}
                render={({ field }) => {
                  const fieldValue = field.value;
                  // Handle boolean, string, or undefined
                  const isActive = 
                    fieldValue === true || 
                    (typeof fieldValue === "string" && (fieldValue === "Yes" || fieldValue === "yes"));
                  const selectValue = isActive ? "Yes" : "No";
                  return (
                    <Select
                      value={selectValue}
                      onValueChange={(value) => {
                        field.onChange(value === "Yes");
                      }}
                      disabled={isViewMode}
                    >
                    <SelectTrigger id="active" className="w-full">
                      <SelectValue placeholder="Please select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  );
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Checklist Questions</CardTitle>
            {!isViewMode && (
              <Button onClick={handleAddQuestion} size="sm" className="gap-2" type="button">
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {questionFields.length === 0 ? (
            <div
              className={cn(
                "p-6 border-2 border-dashed rounded-lg text-center",
                errors?.questions
                  ? "border-destructive bg-destructive"
                  : "border-border bg-muted"
              )}
            >
              <p
                className={cn(
                  "text-sm mb-4",
                  errors?.questions ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {errors?.questions &&
                typeof errors.questions === "object" &&
                "message" in errors.questions
                  ? (errors.questions.message as string)
                  : "No questions added yet."}
              </p>
              {!isViewMode && (
                <Button variant="outline" onClick={handleAddQuestion} className="gap-2" type="button">
                  <Plus className="h-4 w-4" />
                  Add First Question
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Evidence Required?</TableHead>
                    <TableHead>Is Dropdown</TableHead>
                    <TableHead>Dropdown Options</TableHead>
                    {!isViewMode && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`questions.${index}.question`}
                          control={control}
                          render={({ field, fieldState: { error } }) => (
                            <div>
                              <Input
                                {...field}
                                placeholder="Enter question"
                                disabled={isViewMode}
                                className={cn(error && "border-destructive")}
                              />
                              {error && (
                                <p className="text-sm text-destructive mt-1">{error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`questions.${index}.evidenceRequired`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ? "Yes" : "No"}
                              onValueChange={(value) => {
                                field.onChange(value === "Yes");
                              }}
                              disabled={isViewMode}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`questions.${index}.isDropdown`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ? "Yes" : "No"}
                              onValueChange={(value) => {
                                const newValue = value === "Yes";
                                field.onChange(newValue);
                                // Clear dropdownOptions if isDropdown becomes false
                                if (!newValue) {
                                  setValue(`questions.${index}.dropdownOptions`, "");
                                }
                                // Re-validate dropdownOptions field
                                if (trigger) {
                                  setTimeout(() => {
                                    trigger(`questions.${index}.dropdownOptions`);
                                  }, 0);
                                }
                              }}
                              disabled={isViewMode}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`questions.${index}.dropdownOptions`}
                          control={control}
                          render={({ field, fieldState: { error } }) => (
                            <div>
                              <Input
                                {...field}
                                placeholder="Comma separated options"
                                disabled={!(questions && questions[index]?.isDropdown) || isViewMode}
                                className={cn(error && "border-destructive")}
                              />
                              {error && (
                                <p className="text-sm text-destructive mt-1">{error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      </TableCell>
                      {!isViewMode && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveQuestion(index, field.id)}
                            type="button"
                            disabled={removingQuestionId === field.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {removingQuestionId === field.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Gateway to Standard Courses Section */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Gateway to Standard Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCourses ? (
            <div className="flex items-center justify-center h-[300px] gap-3">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">Loading standard courses...</p>
            </div>
          ) : (
            <CourseTransferList
              control={control}
              setValue={setValue}
              allStandardCourses={allStandardCourses}
              disabled={isViewMode}
              leftTitle="Unassigned Standard (Active) Courses"
              rightTitle="Assigned Standard (Active) Courses"
              error={
                !!(
                  errors?.assigned_standards &&
                  typeof errors.assigned_standards === "object" &&
                  "message" in errors.assigned_standards
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
