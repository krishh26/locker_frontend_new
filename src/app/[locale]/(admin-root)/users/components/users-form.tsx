"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Users } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateUserMutation, useUpdateUserMutation } from "@/store/api/user/userApi";
import type { User, CreateUserRequest, UpdateUserRequest, AssignedLearner } from "@/store/api/user/types";
import { useGetEmployersQuery } from "@/store/api/employer/employerApi";
import { useGetCoursesQuery } from "@/store/api/course/courseApi";
import { useGetLearnersListQuery, useUpdateUserCourseMutation } from "@/store/api/learner/learnerApi";
import type { LearnerListItem } from "@/store/api/learner/types";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import { EqaLearnerSelectionDialog } from "./eqa-learner-selection-dialog";
import { AssignedLearnersDataTable } from "./assigned-learners-data-table";
import { toast } from "sonner";

const roles = [
  { value: "Admin", label: "Admin" },
  { value: "Trainer", label: "Trainer" },
  { value: "IQA", label: "IQA" },
  { value: "EQA", label: "EQA" },
  { value: "LIQA", label: "Lead IQA" },
  { value: "Line Manager", label: "Line Manager" },
  { value: "Employer", label: "Employer" },
];

// Common timezones - can be extended
const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const createUserSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    user_name: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    mobile: z.string().min(1, "Mobile number is required"),
    time_zone: z.string().min(1, "Timezone is required"),
    roles: z.array(z.string()).min(1, "At least one role is required"),
    line_manager_id: z.string().optional(),
    employer_ids: z.array(z.number()).optional(),
    selectedCourseForAssignment: z.string().optional(),
    assignedLearners: z.array(z.any()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      const hasEmployerRole = data.roles?.includes("Employer");
      if (hasEmployerRole) {
        return data.employer_ids && data.employer_ids.length > 0;
      }
      return true;
    },
    {
      message: "At least one employee must be selected when Employer role is selected",
      path: ["employer_ids"],
    }
  );

const updateUserSchema = z
  .object({
    first_name: z.string().min(1, "First name is required").optional(),
    last_name: z.string().min(1, "Last name is required").optional(),
    user_name: z.string().min(1, "Username is required").optional(),
    email: z.string().email("Invalid email address").min(1, "Email is required").optional(),
    mobile: z.string().min(1, "Mobile number is required").optional(),
    time_zone: z.string().min(1, "Timezone is required").optional(),
    roles: z.array(z.string()).min(1, "At least one role is required").optional(),
    line_manager_id: z.string().optional(),
    employer_ids: z.array(z.number()).optional(),
    selectedCourseForAssignment: z.string().optional(),
    assignedLearners: z.array(z.any()).optional(),
  })
  .refine(
    (data) => {
      const hasEmployerRole = data.roles?.includes("Employer");
      if (hasEmployerRole) {
        return data.employer_ids && data.employer_ids.length > 0;
      }
      return true;
    },
    {
      message: "At least one employee must be selected when Employer role is selected",
      path: ["employer_ids"],
    }
  );

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

interface UsersFormProps {
  user: User | null;
}

export function UsersForm({ user }: UsersFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEditMode = !!user;

  // EQA learner assignment state
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [updateUserCourse] = useUpdateUserCourseMutation();

  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    mode: "onChange",
        defaultValues: isEditMode
      ? {
          first_name: "",
          last_name: "",
          user_name: "",
          email: "",
          mobile: "",
          time_zone: "",
          roles: [],
          line_manager_id: "",
          employer_ids: [],
          selectedCourseForAssignment: "",
          assignedLearners: [],
        }
      : {
          first_name: "",
          last_name: "",
          user_name: "",
          email: "",
          password: "",
          confirmPassword: "",
          mobile: "",
          time_zone: "",
          roles: [],
          line_manager_id: "",
          employer_ids: [],
          selectedCourseForAssignment: "",
          assignedLearners: [],
        },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        user_name: user.user_name,
        email: user.email,
        mobile: user.mobile,
        time_zone: user.time_zone || "UTC",
        roles: user.roles,
        line_manager_id: user.line_manager?.user_id?.toString() || "",
        employer_ids: user.assigned_employers?.map((employer) => employer.employer_id) || [],
        selectedCourseForAssignment: "",
        assignedLearners: [],
      });
    } else {
      form.reset({
        first_name: "",
        last_name: "",
        user_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobile: "",
        time_zone: "",
        roles: [],
        line_manager_id: "",
        employer_ids: [],
        selectedCourseForAssignment: "",
        assignedLearners: [],
      });
    }
  }, [user, form]);

  // Watch roles to conditionally show employer field and EQA learner selection
  const selectedRoles = form.watch("roles");
  const hasEmployerRole = selectedRoles?.includes("Employer") || false;
  const hasEqaRole = selectedRoles?.includes("EQA") || false;
  
  // Watch form values for EQA assignment
  const selectedCourseForAssignment = form.watch("selectedCourseForAssignment") || "";
  const assignedLearnersValue = form.watch("assignedLearners");
  // Keep all assigned learners in form state (across all courses)
  const allAssignedLearners = useMemo(
    () => (assignedLearnersValue || []) as AssignedLearner[],
    [assignedLearnersValue]
  );
  // Show all assigned learners (from all courses)
  const assignedLearners = useMemo(() => {
    return allAssignedLearners;
  }, [allAssignedLearners]);

  // Fetch all employers
  const { data: employersData, isLoading: isLoadingEmployers } = useGetEmployersQuery(
    { page: 1, page_size: 1000 },
    { skip: !hasEmployerRole }
  );

  // Transform employers to options for MultipleSelector
  const employerOptions: Option[] =
    employersData?.data?.map((employer) => ({
      value: employer.employer_id.toString(),
      label: employer.employer_name,
    })) || [];

  // Fetch all courses for the course selection dropdown
  const { data: coursesData } = useGetCoursesQuery(
    { page: 1, page_size: 1000 },
    { skip: !hasEqaRole }
  );

  // Fetch learners for selected course using course_id parameter
  // Fetch when EQA role is selected and course is selected (for both add and edit modes)
  const { 
    data: learnersDataForSelectedCourse, 
    refetch: refetchLearners 
  } = useGetLearnersListQuery(
    {
      page: 1,
      page_size: 1000,
      course_id: selectedCourseForAssignment ? Number(selectedCourseForAssignment) : undefined,
    },
    {
      skip: !hasEqaRole || !selectedCourseForAssignment,
    }
  );

  // Use learners data from selected course
  const allLearnersData = useMemo(() => {
    if (learnersDataForSelectedCourse?.data) {
      return learnersDataForSelectedCourse;
    }
    return { data: [] };
  }, [learnersDataForSelectedCourse]);

  // Load existing assignments when editing EQA user and course is selected
  useEffect(() => {
    if (
      isEditMode &&
      hasEqaRole &&
      user &&
      allLearnersData?.data &&
      selectedCourseForAssignment
    ) {
      setIsLoadingAssignments(true);
      try {
        const assigned: AssignedLearner[] = [];
        const selectedCourseIdNum = Number(selectedCourseForAssignment);

        allLearnersData.data.forEach((learner: LearnerListItem) => {
          if (learner.course && Array.isArray(learner.course)) {
            learner.course.forEach((course) => {
              // Check if this course matches selected course and has this EQA assigned
              if (
                course.course.course_id === selectedCourseIdNum &&
                course.EQA_id === user.user_id
              ) {
                assigned.push({
                  learner_id: learner.learner_id,
                  first_name: learner.first_name,
                  last_name: learner.last_name,
                  user_name: learner.user_name,
                  email: learner.email,
                  course_id: course.course.course_id,
                  course_name: course.course.course_name,
                  user_course_id: course.user_course_id,
                  course_status: course.course_status,
                  start_date: course.start_date,
                  end_date: course.end_date,
                });
              }
            });
          }
        });

        // Merge with existing assignments instead of replacing
        const currentAssigned = (form.getValues("assignedLearners") || []) as AssignedLearner[];
        const existingIds = new Set(currentAssigned.map((a) => `${a.learner_id}-${a.course_id}`));
        const newOnes = assigned.filter(
          (a) => !existingIds.has(`${a.learner_id}-${a.course_id}`)
        );
        const mergedAssignments = [...currentAssigned, ...newOnes];
        form.setValue("assignedLearners", mergedAssignments);
      } catch (error) {
        console.error("Error loading assigned learners:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    } else if (!hasEqaRole) {
      // Clear assignments only if EQA role is removed (not when no course is selected)
      form.setValue("assignedLearners", []);
    }
  }, [
    isEditMode,
    hasEqaRole,
    user,
    allLearnersData,
    selectedCourseForAssignment,
    form,
  ]);

  // Handle learner selection from dialog
  const handleLearnerSelection = async (selectedLearnerIds: Set<number>, courseId: number) => {
    // Update the selected course in form (for dialog purposes, not for filtering display)
    form.setValue("selectedCourseForAssignment", String(courseId));
    
    // Use the course ID from the dialog
    const targetCourseId = courseId;

    // Get course name from coursesData
    const selectedCourse = coursesData?.data?.find((c) => c.course_id === targetCourseId);
    const courseName = selectedCourse?.course_name || "Unknown Course";

    // Always refetch learners data for the newly selected course
    // Don't rely on allLearnersData as it might be for a different course
    let learnersDataToUse: { data?: LearnerListItem[] } | null = null;
    let retries = 5;
    
    // Wait for form state to update first
    await new Promise(resolve => setTimeout(resolve, 50));
    
    while (retries > 0) {
      try {
        const result = await refetchLearners();
        if (result.data?.data && result.data.data.length > 0) {
          // Verify this data is for the correct course
          const firstLearner = result.data.data[0];
          const hasCorrectCourse = firstLearner.course?.some(
            (c) => c.course?.course_id === targetCourseId
          ) || true; // If no course data, assume it's correct
          
          if (hasCorrectCourse) {
            learnersDataToUse = result.data;
            break;
          }
        }
      } catch (error) {
        console.error("Error refetching learners:", error);
      }
      
      if (retries > 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      retries--;
    }

    // Get learner details for selected IDs
    let selectedLearners: LearnerListItem[] = [];
    
    if (learnersDataToUse?.data && learnersDataToUse.data.length > 0) {
      selectedLearners = learnersDataToUse.data.filter((learner) =>
        selectedLearnerIds.has(learner.learner_id)
      );
    }
    
    // If we still don't have the learners, we can't proceed
    if (!learnersDataToUse?.data || learnersDataToUse.data.length === 0 || selectedLearners.length === 0) {
      console.error("Cannot create assignments: learners data not available after refetch");
      toast.error("Failed to load learner data. Please try again.");
      return;
    }

    // Create assigned learner objects
    const newAssignments: AssignedLearner[] = selectedLearners
      .map((learner) => {
        // Find the course enrollment for this course
        const courseEnrollment = learner.course?.find(
          (c) => c.course?.course_id === targetCourseId
        );

        // If course enrollment exists, use it; otherwise create minimal object
        if (courseEnrollment) {
          return {
            learner_id: learner.learner_id,
            first_name: learner.first_name,
            last_name: learner.last_name,
            user_name: learner.user_name,
            email: learner.email,
            course_id: targetCourseId,
            course_name: courseEnrollment.course?.course_name || courseName,
            user_course_id: courseEnrollment.user_course_id,
            course_status: courseEnrollment.course_status || "Active",
            start_date: courseEnrollment.start_date || "",
            end_date: courseEnrollment.end_date || "",
          };
        } else {
          // Create assignment without enrollment data (will be created on submit)
          return {
            learner_id: learner.learner_id,
            first_name: learner.first_name,
            last_name: learner.last_name,
            user_name: learner.user_name,
            email: learner.email,
            course_id: targetCourseId,
            course_name: courseName,
            user_course_id: 0, // Will be set when enrollment is created
            course_status: "Active",
            start_date: "",
            end_date: "",
          };
        }
      })
      .filter((assignment): assignment is AssignedLearner => assignment !== null);

    // Add to assigned learners (avoid duplicates)
    const currentAssigned = (form.getValues("assignedLearners") || []) as AssignedLearner[];
    const existingIds = new Set(currentAssigned.map((a) => `${a.learner_id}-${a.course_id}`));
    const newOnes = newAssignments.filter(
      (a) => !existingIds.has(`${a.learner_id}-${a.course_id}`)
    );
    
    const updatedAssignments = [...currentAssigned, ...newOnes];
    form.setValue("assignedLearners", updatedAssignments);
    
    // Trigger form re-render to show the table
    form.trigger("assignedLearners");
  };

  // Handle removing a learner from assignment (course-specific)
  const handleRemoveLearner = (learnerId: number, courseId: number) => {
    const currentAssigned = (form.getValues("assignedLearners") || []) as AssignedLearner[];
    // Remove the specific learner-course assignment
    form.setValue(
      "assignedLearners",
      currentAssigned.filter(
        (a) => !(a.learner_id === learnerId && a.course_id === courseId)
      )
    );
  };

  // Get already assigned learner IDs for the dialog (course-specific)
  const alreadyAssignedLearnerIds = useMemo(() => {
    if (!selectedCourseForAssignment) {
      return new Set<number>();
    }
    const courseId = Number(selectedCourseForAssignment);
    return new Set(
      allAssignedLearners
        .filter((a) => a.course_id === courseId)
        .map((a) => a.learner_id)
    );
  }, [allAssignedLearners, selectedCourseForAssignment]);

  const onSubmit = async (values: CreateUserFormValues | UpdateUserFormValues) => {
    try {
      let createdOrUpdatedUserId: number;

      if (isEditMode) {
        const updateData = values as UpdateUserFormValues;
        await updateUser({
          id: user.user_id,
          data: updateData as UpdateUserRequest,
        }).unwrap();
        createdOrUpdatedUserId = user.user_id;
        toast.success("User updated successfully");
      } else {
        const createData = values as CreateUserFormValues;
        const result = await createUser(createData as CreateUserRequest).unwrap();
        createdOrUpdatedUserId = result.data.user_id;
        toast.success("User created successfully");
      }

      // If EQA role is selected and there are assigned learners, update course enrollments
      // if (hasEqaRole && allAssignedLearners.length > 0) {
      //   try {
      //     // Update each learner's course enrollment to set EQA_id
      //     const updatePromises = allAssignedLearners.map((assigned: AssignedLearner) =>
      //       updateUserCourse({
      //         userCourseId: assigned.user_course_id,
      //         data: {
      //           EQA_id: createdOrUpdatedUserId,
      //         },
      //       }).unwrap()
      //     );

      //     await Promise.all(updatePromises);
      //     toast.success(`Successfully assigned ${allAssignedLearners.length} learner(s) to EQA`);
      //   } catch (assignmentError) {
      //     console.error("Error assigning learners:", assignmentError);
      //     toast.error("User created/updated but failed to assign some learners");
      //   }
      // }

      router.push("/users");
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || `Failed to ${isEditMode ? "update" : "create"} user`);
    }
  };

  const isLoading = isCreating || isUpdating;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* First Name & Last Name */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="first_name"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="first_name"
                  placeholder="Enter first name"
                  {...field}
                  className={form.formState.errors.first_name ? "border-destructive" : ""}
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="last_name"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="last_name"
                  placeholder="Enter last name"
                  {...field}
                  className={form.formState.errors.last_name ? "border-destructive" : ""}
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Username & Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user_name">
            Username <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="user_name"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="user_name"
                  placeholder="Enter username"
                  {...field}
                  className={form.formState.errors.user_name ? "border-destructive" : ""}
                />
                {form.formState.errors.user_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.user_name.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="email"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  {...field}
                  className={form.formState.errors.email ? "border-destructive" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Password & Confirm Password (only for create) */}
      {!isEditMode && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="password"
              control={form.control}
              render={({ field }) => (
                <>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      {...field}
                      className={
                        !isEditMode &&
                        form.formState.errors &&
                        "password" in form.formState.errors
                          ? "border-destructive pr-10"
                          : "pr-10"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {!isEditMode &&
                    form.formState.errors &&
                    "password" in form.formState.errors &&
                    (form.formState.errors as Record<string, { message?: string }>).password && (
                      <p className="text-sm text-destructive">
                        {(form.formState.errors as Record<string, { message?: string }>).password?.message}
                      </p>
                    )}
                </>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field }) => (
                <>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      {...field}
                      className={
                        !isEditMode &&
                        form.formState.errors &&
                        "confirmPassword" in form.formState.errors
                          ? "border-destructive pr-10"
                          : "pr-10"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {!isEditMode &&
                    form.formState.errors &&
                    "confirmPassword" in form.formState.errors && (
                      <p className="text-sm text-destructive">
                        {(form.formState.errors as Record<string, { message?: string }>).confirmPassword?.message}
                      </p>
                    )}
                </>
              )}
            />
          </div>
        </div>
      )}

      {/* Mobile & Timezone */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mobile">
            Mobile <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="mobile"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="mobile"
                  placeholder="Enter mobile number"
                  {...field}
                  className={form.formState.errors.mobile ? "border-destructive" : ""}
                />
                {form.formState.errors.mobile && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.mobile.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time_zone">
            Time Zone <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="time_zone"
            control={form.control}
            render={({ field }) => (
              <>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="time_zone"
                    className={form.formState.errors.time_zone ? "w-full border-destructive" : "w-full"}
                  >
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.time_zone && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.time_zone.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Roles */}
      <div className="space-y-2">
        <Label>
          Roles <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="roles"
          control={form.control}
          render={({ field }) => (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {roles.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={field.value?.includes(role.label)}
                      onCheckedChange={(checked) => {
                        const currentRoles = field.value || [];
                        if (checked) {
                          field.onChange([...currentRoles, role.label]);
                        } else {
                          const newRoles = currentRoles.filter((r) => r !== role.label);
                          field.onChange(newRoles);
                          // Clear employer_ids if Employer role is removed
                          if (role.label === "Employer") {
                            form.setValue("employer_ids", []);
                          }
                          // Clear assigned learners if EQA role is removed
                          if (role.label === "EQA") {
                            form.setValue("assignedLearners", []);
                            form.setValue("selectedCourseForAssignment", "");
                          }
                        }
                      }}
                    />
                    <Label
                      htmlFor={`role-${role.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors.roles && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.roles.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Employees - Only show when Employer role is selected */}
      {hasEmployerRole && (
        <div className="space-y-2">
          <Label htmlFor="employer_ids">
            Employers <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="employer_ids"
            control={form.control}
            render={({ field }) => {
              const selectedOptions: Option[] =
                field.value?.map((id) => {
                  const employer = employersData?.data?.find(
                    (e) => e.employer_id === Number(id)
                  );
                  return {
                    value: id.toString(),
                    label: employer?.employer_name || id.toString(),
                  };
                }) || [];

              return (
                <>
                  <MultipleSelector
                    value={selectedOptions}
                    options={employerOptions}
                    placeholder={
                      isLoadingEmployers
                        ? "Loading employers..."
                        : "Select employers"
                    }
                    onChange={(options: Option[]) => {
                      const ids = options.map((opt: Option) => Number(opt.value));
                      field.onChange(ids);
                    }}
                    disabled={isLoadingEmployers}
                    loadingIndicator={
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    }
                    emptyIndicator={
                      <p className="text-center text-sm text-muted-foreground">
                        No employers found
                      </p>
                    }
                    className={`w-full ${
                      form.formState.errors.employer_ids
                        ? "border-destructive"
                        : ""
                    }`}
                    direction="up"
                  />
                  {form.formState.errors.employer_ids && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.employer_ids.message}
                    </p>
                  )}
                </>
              );
            }}
          />
        </div>
      )}

      {/* EQA Learner Assignment Section */}
      {hasEqaRole && (
        <div className="space-y-4 pt-4 border-t">
          <div>
            <Label className="text-base font-semibold">Assigned Learners</Label>
            <p className="text-sm text-muted-foreground">
              Select a course to view and manage assigned learners for this EQA user
            </p>
          </div>

          {/* Course Selection - Removed, now managed in dialog */}
          <div className="space-y-2">
            <Label>Select Learners</Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectionDialogOpen(true)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Users className="mr-2 h-4 w-4" />
              Select Learners
            </Button>
          </div>

          {/* Assigned Learners Table - Show all assigned learners from all courses */}
          {allAssignedLearners.length > 0 ? (
            <AssignedLearnersDataTable
              data={assignedLearners}
              onRemove={handleRemoveLearner}
              isLoading={isLoadingAssignments}
            />
          ) : (
            !isLoadingAssignments && (
              <div className="flex items-center justify-center py-8 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  No learners assigned yet. Click &quot;Select Learners&quot; to assign learners to courses.
                </p>
              </div>
            )
          )}
          {isLoadingAssignments && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Learner Selection Dialog */}
      <EqaLearnerSelectionDialog
        open={selectionDialogOpen}
        onOpenChange={setSelectionDialogOpen}
        onSave={handleLearnerSelection}
        currentEqaId={isEditMode ? user?.user_id : undefined}
        alreadyAssignedLearnerIds={alreadyAssignedLearnerIds}
      />

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/users")}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || hasErrors} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? "Update User" : "Create User"}
        </Button>
      </div>
      </form>
    </FormProvider>
  );
}
