"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import {
  useGetUsersQuery,
} from "@/store/api/user/userApi";
import {
  useCreateUserCourseMutation,
  useUpdateUserCourseMutation,
  useDeleteUserCourseMutation,
} from "@/store/api/learner/learnerApi";
import type { LearnerData, LearnerCourse } from "@/store/api/learner/types";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CourseInformationTabProps {
  learner: LearnerData;
  canEdit?: boolean;
}

// Course status options
const COURSE_STATUS_OPTIONS = [
  "Awaiting Induction",
  "Certificated",
  "Completed",
  "Early Leaver",
  "Exempt",
  "In Training",
  "IQA Approved",
  "Training Suspended",
  "Transferred",
];

const courseSchema = z.object({
  course_id: z.string().min(1, "Please select a course"),
  trainer_id: z.string().min(1, "Please select a trainer"),
  IQA_id: z.string().min(1, "Please select an IQA"),
  LIQA_id: z.string().min(1, "Please select a LIQA"),
  EQA_id: z.string().min(1, "Please select an EQA"),
  start_date: z.string().min(1, "Please select a start date"),
  end_date: z.string().min(1, "Please select an end date"),
  predicted_grade: z.string().min(1, "Please enter predicted grade"),
  final_grade: z.string().min(1, "Please enter final grade"),
  is_main_course: z.boolean().optional(),
  course_status: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type CourseFormValues = z.infer<typeof courseSchema>;

export function CourseInformationTab({
  learner,
  canEdit = false,
}: CourseInformationTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<LearnerCourse | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const courses = learner.course || [];

  // Fetch courses list for dropdown
  const { data: coursesResponse, isLoading: isLoadingCourses } =
    useCachedCoursesList();

  // Fetch users by role
  const { data: trainersData } = useGetUsersQuery({
    page: 1,
    page_size: 500,
    role: "Trainer",
  });
  const { data: iqaData } = useGetUsersQuery({
    page: 1,
    page_size: 500,
    role: "IQA",
  });
  const { data: liqaData } = useGetUsersQuery({
    page: 1,
    page_size: 500,
    role: "LIQA",
  });
  const { data: eqaData } = useGetUsersQuery({
    page: 1,
    page_size: 500,
    role: "EQA",
  });

  const [createUserCourse, { isLoading: isCreating }] =
    useCreateUserCourseMutation();
  const [updateUserCourse, { isLoading: isUpdating }] =
    useUpdateUserCourseMutation();
  const [deleteUserCourse, { isLoading: isDeleting }] =
    useDeleteUserCourseMutation();

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      course_id: "",
      trainer_id: "",
      IQA_id: "",
      LIQA_id: "",
      EQA_id: "",
      start_date: "",
      end_date: "",
      predicted_grade: "",
      final_grade: "",
      is_main_course: false,
      course_status: "",
    },
  });

  const coursesList = coursesResponse?.data || [];
  const trainers = trainersData?.data || [];
  const iqas = iqaData?.data || [];
  const liqas = liqaData?.data || [];
  const eqas = eqaData?.data || [];

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
    if (
      statusLower.includes("completed") ||
      statusLower.includes("certificated")
    ) {
      return "default";
    }
    if (
      statusLower.includes("suspended") ||
      statusLower.includes("leaver")
    ) {
      return "destructive";
    }
    return "secondary";
  };

  const handleOpenDialog = (course?: LearnerCourse) => {
    if (course) {
      setSelectedCourse(course);
      setIsEditMode(true);
      // Extract IDs from nested objects
      const courseData = course as LearnerCourse & {
        trainer_id?: { user_id: number } | number | string;
        IQA_id?: { user_id: number } | number | string;
        LIQA_id?: { user_id: number } | number | string;
        EQA_id?: { user_id: number } | number | string;
        predicted_grade?: string;
        final_grade?: string;
      };
      
      const trainerId =
        (typeof courseData.trainer_id === "object" && courseData.trainer_id?.user_id) ||
        courseData.trainer_id?.toString() ||
        "";
      const iqaId =
        (typeof courseData.IQA_id === "object" && courseData.IQA_id?.user_id) ||
        courseData.IQA_id?.toString() ||
        "";
      const liqaId =
        (typeof courseData.LIQA_id === "object" && courseData.LIQA_id?.user_id) ||
        courseData.LIQA_id?.toString() ||
        "";
      const eqaId =
        (typeof courseData.EQA_id === "object" && courseData.EQA_id?.user_id) ||
        courseData.EQA_id?.toString() ||
        "";

      form.reset({
        course_id: course.course?.course_id?.toString() || "",
        trainer_id: trainerId.toString(),
        IQA_id: iqaId.toString(),
        LIQA_id: liqaId.toString(),
        EQA_id: eqaId.toString(),
        start_date: course.start_date
          ? new Date(course.start_date).toISOString().split("T")[0]
          : "",
        end_date: course.end_date
          ? new Date(course.end_date).toISOString().split("T")[0]
          : "",
        predicted_grade: courseData.predicted_grade || "",
        final_grade: courseData.final_grade || "",
        is_main_course: course.is_main_course || false,
        course_status: course.course_status || "",
      });
    } else {
      setSelectedCourse(null);
      setIsEditMode(false);
      form.reset({
        course_id: "",
        trainer_id: "",
        IQA_id: "",
        LIQA_id: "",
        EQA_id: "",
        start_date: "",
        end_date: "",
        predicted_grade: "",
        final_grade: "",
        is_main_course: false,
        course_status: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCourse(null);
    setIsEditMode(false);
    form.reset();
  };

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (isEditMode && selectedCourse) {
        await updateUserCourse({
          userCourseId: selectedCourse.user_course_id,
          data: {
            trainer_id: Number(data.trainer_id),
            IQA_id: Number(data.IQA_id),
            LIQA_id: Number(data.LIQA_id),
            EQA_id: Number(data.EQA_id),
            start_date: data.start_date,
            end_date: data.end_date,
            predicted_grade: data.predicted_grade,
            final_grade: data.final_grade,
            is_main_course: data.is_main_course,
            course_status: data.course_status || undefined,
          },
        }).unwrap();
        toast.success("Course updated successfully");
      } else {
        await createUserCourse({
          learner_id: learner.learner_id,
          course_id: Number(data.course_id),
          trainer_id: Number(data.trainer_id),
          IQA_id: Number(data.IQA_id),
          LIQA_id: Number(data.LIQA_id),
          EQA_id: Number(data.EQA_id),
          start_date: data.start_date,
          end_date: data.end_date,
          predicted_grade: data.predicted_grade,
          final_grade: data.final_grade,
          is_main_course: data.is_main_course || false,
        }).unwrap();
        toast.success("Course added successfully");
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save course:", error);
      toast.error(
        `Failed to ${isEditMode ? "update" : "add"} course. Please try again.`
      );
    }
  });

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      await deleteUserCourse(selectedCourse.user_course_id).unwrap();
      toast.success("Course deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course. Please try again.");
    }
  };

  const handleDeleteClick = (course: LearnerCourse) => {
    setSelectedCourse(course);
    setDeleteDialogOpen(true);
  };

  // Check if there's already a main course
  const hasMainCourse = courses.some((c) => c.is_main_course);
  const isSelectedCourseMain = selectedCourse?.is_main_course;

  if (courses.length === 0 && !canEdit) {
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Course Information</CardTitle>
          {canEdit && (
            <Button
              type="button"
              onClick={() => handleOpenDialog()}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Course
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No course information available.
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleOpenDialog()}
                >
                  Add Your First Course
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Main Course</TableHead>
                    {canEdit && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.user_course_id}>
                      <TableCell className="font-medium max-w-[100px]">
                        <div
                          className="truncate"
                          title={course.course?.course_name || "-"}
                        >
                          {course.course?.course_name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{course.course?.level || "-"}</TableCell>
                      <TableCell>{formatDate(course.start_date)}</TableCell>
                      <TableCell>{formatDate(course.end_date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(course.course_status)}
                          className={cn(
                            course.course_status === "Completed" ||
                              course.course_status === "Certificated"
                              ? "bg-accent/10 text-accent hover:bg-accent/10"
                              : course.course_status === "Early Leaver" ||
                                course.course_status === "Training Suspended"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
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
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(course)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(course)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

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
                      <span className="text-muted-foreground">
                        Total Credits:
                      </span>
                      <span>{course.course?.total_credits || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Guided Learning Hours:
                      </span>
                      <span>
                        {course.course?.guided_learning_hours || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Course Type:
                      </span>
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

      {/* Add/Edit Course Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Course" : "Add New Course"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the course information below."
                : "Fill in the course details below. Fields marked with * are required."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Course Selection - Disabled in edit mode */}
              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Select Course <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditMode || isLoadingCourses}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coursesList.map((course) => (
                          <SelectItem
                            key={course.course_id}
                            value={course.course_id.toString()}
                          >
                            {course.course_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Status - Only shown in edit mode */}
              {isEditMode && (
                <FormField
                  control={form.control}
                  name="course_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select course status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trainer */}
                <FormField
                  control={form.control}
                  name="trainer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Trainer <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select trainer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {trainers.map((trainer) => (
                            <SelectItem
                              key={trainer.user_id}
                              value={trainer.user_id.toString()}
                            >
                              {trainer.user_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* IQA */}
                <FormField
                  control={form.control}
                  name="IQA_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        IQA <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select IQA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iqas.map((iqa) => (
                            <SelectItem
                              key={iqa.user_id}
                              value={iqa.user_id.toString()}
                            >
                              {iqa.user_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LIQA */}
                <FormField
                  control={form.control}
                  name="LIQA_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        LIQA <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select LIQA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {liqas.map((liqa) => (
                            <SelectItem
                              key={liqa.user_id}
                              value={liqa.user_id.toString()}
                            >
                              {liqa.user_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* EQA */}
                <FormField
                  control={form.control}
                  name="EQA_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        EQA <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select EQA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eqas.map((eqa) => (
                            <SelectItem
                              key={eqa.user_id}
                              value={eqa.user_id.toString()}
                            >
                              {eqa.user_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Predicted Grade */}
                <FormField
                  control={form.control}
                  name="predicted_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Predicted Grade{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter predicted grade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Final Grade */}
                <FormField
                  control={form.control}
                  name="final_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Final Grade <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter final grade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Main Course Checkbox */}
              <FormField
                control={form.control}
                name="is_main_course"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={
                          isEditMode &&
                          !isSelectedCourseMain &&
                          hasMainCourse
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Main Aim Course</FormLabel>
                      {isEditMode &&
                        !isSelectedCourseMain &&
                        hasMainCourse && (
                          <p className="text-sm text-muted-foreground">
                            Another course is already set as main course
                          </p>
                        )}
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Update Course" : "Add Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              course allocation for{" "}
              {selectedCourse?.course?.course_name || "this course"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedCourse(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
