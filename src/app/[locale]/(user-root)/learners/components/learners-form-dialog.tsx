"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useCreateLearnerMutation,
  useUpdateLearnerMutation,
} from "@/store/api/learner/learnerApi";
import type {
  LearnerListItem,
  CreateLearnerRequest,
  UpdateLearnerRequest,
} from "@/store/api/learner/types";
import { useGetEmployersQuery } from "@/store/api/employer/employerApi";
import { toast } from "sonner";

// Funding body options from constants
const fundingBodies = [
  "Advance Learning Loan",
  "Bursary",
  "Commercial",
  "Community Learning",
  "EFA",
  "Employer",
  "ESF",
  "ESFA",
  "Fee Waiver",
  "FWDF",
  "ITA",
  "Levy",
  "MA Fully Funded",
  "MA-Employer",
  "Non-Levy",
  "Other",
  "SAAS",
  "SAAS-Employer",
  "SAAS-Self",
  "SDS",
  "Self",
  "SFA",
  "Student Loan",
];

const EMPLOYER_PLACEHOLDER_VALUE = "__none__";

const createLearnerSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    user_name: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    mobile: z.string().min(1, "Mobile number is required"),
    employer_id: z.string().refine((v) => v && v !== EMPLOYER_PLACEHOLDER_VALUE, {
      message: "Employer is required",
    }),
    funding_body: z.string().min(1, "Funding body is required"),
    national_ins_no: z.string().optional(),
    job_title: z.string().min(1, "Job title is required"),
    comment: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const updateLearnerSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  user_name: z.string().min(1, "Username is required").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required").optional(),
  mobile: z.string().min(1, "Mobile number is required").optional(),
  employer_id: z
    .string()
    .optional()
    .refine((v) => !v || v !== EMPLOYER_PLACEHOLDER_VALUE, {
      message: "Employer is required",
    }),
  funding_body: z.string().min(1, "Funding body is required").optional(),
  national_ins_no: z.string().optional(),
  job_title: z.string().min(1, "Job title is required").optional(),
  comment: z.string().optional(),
});

type CreateLearnerFormValues = z.infer<typeof createLearnerSchema>;
type UpdateLearnerFormValues = z.infer<typeof updateLearnerSchema>;

interface LearnersFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: LearnerListItem | null;
  onSuccess: () => void;
}

export function LearnersFormDialog({
  open,
  onOpenChange,
  learner,
  onSuccess,
}: LearnersFormDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEditMode = !!learner;

  const [createLearner, { isLoading: isCreating }] = useCreateLearnerMutation();
  const [updateLearner, { isLoading: isUpdating }] = useUpdateLearnerMutation();

  const { data: employersData, isLoading: isLoadingEmployers } = useGetEmployersQuery(
    { page: 1, page_size: 100 },
    { skip: !open }
  );
  const employerOptions = employersData?.data ?? [];

  const form = useForm<CreateLearnerFormValues | UpdateLearnerFormValues>({
    resolver: zodResolver(isEditMode ? updateLearnerSchema : createLearnerSchema),
    defaultValues: isEditMode
      ? {
          first_name: "",
          last_name: "",
          user_name: "",
          email: "",
          mobile: "",
          employer_id: EMPLOYER_PLACEHOLDER_VALUE,
          funding_body: "",
          national_ins_no: "",
          job_title: "",
          comment: "",
        }
      : {
          first_name: "",
          last_name: "",
          user_name: "",
          email: "",
          password: "",
          confirmPassword: "",
          mobile: "",
          employer_id: EMPLOYER_PLACEHOLDER_VALUE,
          funding_body: "",
          national_ins_no: "",
          job_title: "",
          comment: "",
        },
  });

  useEffect(() => {
    if (learner && open) {
      form.reset({
        first_name: learner.first_name,
        last_name: learner.last_name,
        user_name: learner.user_name,
        email: learner.email,
        mobile: learner.mobile || "",
        employer_id:
          learner.employer_id != null
            ? typeof learner.employer_id === "object"
              ? String(learner.employer_id.employer_id)
              : String(learner.employer_id)
            : EMPLOYER_PLACEHOLDER_VALUE,
        funding_body: learner.funding_body || "",
        national_ins_no: learner.national_ins_no || "",
        job_title: learner.job_title || "",
        comment: learner.comment || "",
      });
    } else if (!learner && open) {
      form.reset({
        first_name: "",
        last_name: "",
        user_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobile: "",
        employer_id: EMPLOYER_PLACEHOLDER_VALUE,
        funding_body: "",
        national_ins_no: "",
        job_title: "",
        comment: "",
      });
    }
  }, [learner, open, form]);

  const onSubmit = async (values: CreateLearnerFormValues | UpdateLearnerFormValues) => {
    try {
      if (isEditMode) {
        const updateData = values as UpdateLearnerFormValues;
        await updateLearner({
          id: learner.learner_id,
          data: updateData as UpdateLearnerRequest,
        }).unwrap();
        toast.success("Learner updated successfully");
      } else {
        const createData = values as CreateLearnerFormValues;
        await createLearner(createData as CreateLearnerRequest).unwrap();
        toast.success("Learner created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || `Failed to ${isEditMode ? "update" : "create"} learner`);
    }
  };

  const isLoading = isCreating || isUpdating;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Learner" : "Create New Learner"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update learner information below."
              : "Fill in the form below to create a new learner."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        "password" in form.formState.errors && (
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

          {/* Mobile & Employer */}
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
              <Label htmlFor="employer_id">
                Employer <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="employer_id"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value || EMPLOYER_PLACEHOLDER_VALUE}
                      onValueChange={field.onChange}
                      disabled={isLoadingEmployers}
                    >
                      <SelectTrigger
                        id="employer_id"
                        className={form.formState.errors.employer_id ? "border-destructive" : ""}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingEmployers ? "Loading employers..." : "Select employer"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPLOYER_PLACEHOLDER_VALUE}>
                          Select employer
                        </SelectItem>
                        {employerOptions.map((employer) => (
                          <SelectItem
                            key={employer.employer_id}
                            value={String(employer.employer_id)}
                          >
                            {employer.employer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.employer_id && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.employer_id.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          {/* Funding Body & National Insurance Number */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="funding_body">
                Funding Body <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="funding_body"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="funding_body"
                        className={form.formState.errors.funding_body ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Select funding body" />
                      </SelectTrigger>
                      <SelectContent>
                        {fundingBodies.map((body) => (
                          <SelectItem key={body} value={body}>
                            {body}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.funding_body && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.funding_body.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="national_ins_no">National Insurance Number</Label>
              <Controller
                name="national_ins_no"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="national_ins_no"
                    placeholder="Enter national insurance number"
                    {...field}
                  />
                )}
              />
            </div>
          </div>

          {/* Job Title & Comment */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job_title">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="job_title"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Input
                      id="job_title"
                      placeholder="Enter job title"
                      {...field}
                      className={form.formState.errors.job_title ? "border-destructive" : ""}
                    />
                    {form.formState.errors.job_title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.job_title.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Controller
                name="comment"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="comment"
                    placeholder="Enter comment (optional)"
                    {...field}
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || hasErrors}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

