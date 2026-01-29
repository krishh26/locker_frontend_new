"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Users } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import { useAssignEqaToCourseMutation, useGetEqaAssignedLearnersQuery } from "@/store/api/learner/learnerApi";
import type { LearnerListItem } from "@/store/api/learner/types";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import { EqaLearnerSelectionDialog } from "./eqa-learner-selection-dialog";
import { AssignedLearnersDataTable } from "./assigned-learners-data-table";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

// Roles will be translated in component
const roleValues = [
  "Admin",
  "Trainer",
  "IQA",
  "EQA",
  "LIQA",
  "Line Manager",
  "Employer",
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

// Schema creation functions that accept translation function
const createUserSchema = (t: (key: string) => string) => z
  .object({
    first_name: z.string().min(1, t("validation.firstNameRequired")),
    last_name: z.string().min(1, t("validation.lastNameRequired")),
    user_name: z.string().min(1, t("validation.usernameRequired")),
    email: z.string().email(t("validation.emailInvalid")).min(1, t("validation.emailRequired")),
    password: z.string().min(6, t("validation.passwordMinLength")),
    confirmPassword: z.string(),
    mobile: z.string().optional(),
    time_zone: z.string().optional(),
    roles: z.array(z.string()).min(1, t("validation.rolesRequired")),
    line_manager_id: z.string().optional(),
    employer_ids: z.array(z.number()).optional(),
    organisation_ids: z.array(z.number()).optional(),
    selectedCourseForAssignment: z.string().optional(),
    assignedLearners: z.array(z.any()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("validation.passwordsDoNotMatch"),
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
      message: t("validation.employerRequired"),
      path: ["employer_ids"],
    }
  );

const updateUserSchema = (t: (key: string) => string) => z
  .object({
    first_name: z.string().min(1, t("validation.firstNameRequired")).optional(),
    last_name: z.string().min(1, t("validation.lastNameRequired")).optional(),
    user_name: z.string().min(1, t("validation.usernameRequired")).optional(),
    email: z.string().email(t("validation.emailInvalid")).min(1, t("validation.emailRequired")).optional(),
    mobile: z.string().optional(),
    time_zone: z.string().optional(),
    roles: z.array(z.string()).min(1, t("validation.rolesRequired")).optional(),
    line_manager_id: z.string().optional(),
    employer_ids: z.array(z.number()).optional(),
    organisation_ids: z.array(z.number()).optional(),
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
      message: t("validation.employerRequired"),
      path: ["employer_ids"],
    }
  );

type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>;
type UpdateUserFormValues = z.infer<ReturnType<typeof updateUserSchema>>;

interface UsersFormProps {
  user: User | null;
}

export function UsersForm({ user }: UsersFormProps) {
  const router = useRouter();
  const t = useTranslations("users");
  const common = useTranslations("common");
  const authUser = useAppSelector((state) => state.auth.user);
  const userRole = authUser?.role;
  const isEmployer = userRole === "Employer";
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEditMode = !!user;

  // Create roles with translated labels
  const roles = useMemo(() => {
    const roleKeyMap: Record<string, string> = {
      "Admin": "admin",
      "Trainer": "trainer",
      "IQA": "iqa",
      "EQA": "eqa",
      "LIQA": "liqa",
      "Line Manager": "lineManager",
      "Employer": "employer",
    };
    return roleValues.map(value => ({
      value,
      label: t(`roles.${roleKeyMap[value]}`) || value,
    }));
  }, [t]);

  // EQA learner assignment state
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [assignEqaToCourse] = useAssignEqaToCourseMutation();

  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(isEditMode ? updateUserSchema(t) : createUserSchema(t)),
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
          organisation_ids: [],
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
          organisation_ids: [],
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
        organisation_ids: user.assigned_organisations?.map((org) => org.id) || [],
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
        organisation_ids: [],
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
  const { data: coursesData } = useCachedCoursesList({
    skip: !hasEqaRole
  });

  // Fetch assigned learners for EQA when in edit mode
  const { 
    data: eqaAssignedLearnersData, 
    isLoading: isLoadingEqaAssignedLearners 
  } = useGetEqaAssignedLearnersQuery(
    {
      eqaId: user?.user_id || 0,
      page: 1,
      page_size: 1000, // Large page size to get all assigned learners
      meta: true,
    },
    { skip: !isEditMode || !hasEqaRole || !user?.user_id }
  );


  // Load existing assignments from API when editing EQA user
  useEffect(() => {
    if (isEditMode && hasEqaRole && eqaAssignedLearnersData?.data) {
      const assigned: AssignedLearner[] = eqaAssignedLearnersData.data.map((item) => ({
        learner_id: item.learner_id?.learner_id || 0,
        first_name: item.learner_id?.first_name || "",
        last_name: item.learner_id?.last_name || "",
        user_name: item.learner_id?.user_name || "",
        email: item.learner_id?.email || "",
        course_id: item.course?.course_id || 0,
        course_name: item.course?.course_name || "",
        user_course_id: item.user_course_id || 0,
        course_status: item.course_status || "",
        start_date: item.start_date || "",
        end_date: item.end_date || "",
      }));

      form.setValue("assignedLearners", assigned);
    } else if (!hasEqaRole) {
      // Clear assignments only if EQA role is removed
      form.setValue("assignedLearners", []);
    }
  }, [
    isEditMode,
    hasEqaRole,
    eqaAssignedLearnersData,
    form,
  ]);

  // Update loading state based on API query
  useEffect(() => {
    setIsLoadingAssignments(isLoadingEqaAssignedLearners);
  }, [isLoadingEqaAssignedLearners]);

  // Handle learner selection from dialog
  const handleLearnerSelection = (selectedLearners: Set<LearnerListItem>, courseId: number) => {
    // Get course name from coursesData
    const selectedCourse = coursesData?.data?.find((c) => c.course_id === courseId);
    const courseName = selectedCourse?.course_name || "Unknown Course";

    // Create assigned learner objects directly from the passed learner objects
    const newAssignments: AssignedLearner[] = Array.from(selectedLearners)
      .map((learner) => {
        // Find the course enrollment for this course
        const courseEnrollment = learner.course?.find(
          (c) => c.course?.course_id === courseId
        );

        // If course enrollment exists, use it; otherwise create minimal object
        if (courseEnrollment) {
          return {
            learner_id: learner.learner_id,
            first_name: learner.first_name,
            last_name: learner.last_name,
            user_name: learner.user_name,
            email: learner.email,
            course_id: courseId,
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
            course_id: courseId,
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
  const handleRemoveLearner = async (learnerId: number, courseId: number) => {
    // If in edit mode, call API to unassign
    if (isEditMode && user?.user_id && hasEqaRole) {
        const payload = {
          course_id: courseId,
          eqa_id: user.user_id,
          learner_ids: [learnerId],
          action: "unassign" as const,
        };
        console.log("Unassign API Payload:", payload);
        await assignEqaToCourse(payload).unwrap();
    }
    try {
      // Update form state to remove the learner
      const currentAssigned = (form.getValues("assignedLearners") || []) as AssignedLearner[];
      form.setValue(
        "assignedLearners",
        currentAssigned.filter(
          (a) => !(a.learner_id === learnerId && a.course_id === courseId)
        )
      );
      toast.success(t("toast.learnerUnassigned"));
    } catch (error) {
      console.error("Error removing learner:", error);
      toast.error(t("toast.removeLearnerFailed"));
    }
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
      let createdOrUpdatedUserId: number ;

      // For Admin users, auto-populate organisation_ids from assigned_organisations if editing
      // Admin organizations are managed via "Assign Admin to Organisation" API, not through this form
      if (user?.assigned_organisations) {
        values.organisation_ids = user.assigned_organisations.map(org => org.id);
      } 
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

      // If EQA role is selected and there are assigned learners, assign EQA to courses
      if (hasEqaRole && allAssignedLearners.length > 0) {
        try {
          // Group learners by course_id
          const learnersByCourse = new Map<number, number[]>();
          allAssignedLearners.forEach((assigned: AssignedLearner) => {
            const courseId = assigned.course_id;
            if (!learnersByCourse.has(courseId)) {
              learnersByCourse.set(courseId, []);
            }
            learnersByCourse.get(courseId)!.push(assigned.learner_id);
          });

          // Create API calls for each course
          const assignmentPromises = Array.from(learnersByCourse.entries()).map(
            ([courseId, learnerIds]) => {
              const payload = {
                course_id: courseId,
                eqa_id: createdOrUpdatedUserId,
                learner_ids: learnerIds,
                action: "assign" as const,
              };
              return assignEqaToCourse(payload).unwrap();
            }
          );

          await Promise.all(assignmentPromises);
          toast.success(t("toast.learnersAssigned", { count: allAssignedLearners.length }));
        } catch (assignmentError) {
          console.error("Error assigning learners:", assignmentError);
          toast.error(t("toast.assignmentFailed"));
        }
      }

      router.push("/users");
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || (isEditMode ? t("toast.updateFailed") : t("toast.createFailed")));
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
            {t("form.firstName")}<span className="text-destructive">{t("form.required")}</span>
          </Label>
          <Controller
            name="first_name"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="first_name"
                  placeholder={t("form.firstNamePlaceholder")}
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
            {t("form.lastName")}<span className="text-destructive">{t("form.required")}</span>
          </Label>
          <Controller
            name="last_name"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="last_name"
                  placeholder={t("form.lastNamePlaceholder")}
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
            {t("form.username")}<span className="text-destructive">{t("form.required")}</span>
          </Label>
          <Controller
            name="user_name"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="user_name"
                  placeholder={t("form.usernamePlaceholder")}
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
            {t("form.email")}<span className="text-destructive">{t("form.required")}</span>
          </Label>
          <Controller
            name="email"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("form.emailPlaceholder")}
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
              {t("form.password")}<span className="text-destructive">{t("form.required")}</span>
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
                      placeholder={t("form.passwordPlaceholder")}
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
              {t("form.confirmPassword")}<span className="text-destructive">{t("form.required")}</span>
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
                      placeholder={t("form.confirmPasswordPlaceholder")}
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
            {t("form.mobile")}
          </Label>
          <Controller
            name="mobile"
            control={form.control}
            render={({ field }) => (
              <>
                <Input
                  id="mobile"
                  placeholder={t("form.mobilePlaceholder")}
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
            {t("form.timeZone")}
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
                    <SelectValue placeholder={t("form.timeZonePlaceholder")} />
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
          {t("form.roles")} <span className="text-destructive">{t("form.required")}</span>
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
            {t("form.employers")} <span className="text-destructive">{t("form.required")}</span>
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
                        ? t("form.loadingEmployers")
                        : t("form.employersPlaceholder")
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
                        {t("form.noEmployersFound")}
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
            <Label className="text-base font-semibold">{t("form.assignedLearners")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("form.assignedLearnersDescription")}
            </p>
          </div>

          {/* Course Selection - Removed, now managed in dialog */}
          <div className="space-y-2">
            <Label>{t("form.selectLearners")}</Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectionDialogOpen(true)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Users className="mr-2 h-4 w-4" />
              {t("form.selectLearners")}
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
                  {t("form.noLearnersAssigned")}
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
          {common("cancel")}
        </Button>
        {!isEmployer && (
          <Button type="submit" disabled={isLoading || hasErrors} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? t("form.updateUser") : t("form.createUser")}
          </Button>
        )}
      </div>
      </form>
    </FormProvider>
  );
}
