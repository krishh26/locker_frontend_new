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
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateUserMutation, useUpdateUserMutation } from "@/store/api/user/userApi";
import type { User, CreateUserRequest, UpdateUserRequest } from "@/store/api/user/types";
import { toast } from "sonner";

const roles = [
  { value: "Admin", label: "Admin" },
  { value: "Trainer", label: "Trainer" },
  { value: "IQA", label: "IQA" },
  { value: "EQA", label: "EQA" },
  { value: "LIQA", label: "Lead IQA" },
  { value: "Line Manager", label: "Line Manager" },
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const updateUserSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  user_name: z.string().min(1, "Username is required").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required").optional(),
  mobile: z.string().min(1, "Mobile number is required").optional(),
  time_zone: z.string().min(1, "Timezone is required").optional(),
  roles: z.array(z.string()).min(1, "At least one role is required").optional(),
  line_manager_id: z.string().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

interface UsersFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function UsersFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UsersFormDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEditMode = !!user;

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

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
        },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        user_name: user.user_name,
        email: user.email,
        mobile: user.mobile,
        time_zone: user.time_zone,
        roles: user.roles,
        line_manager_id: user.line_manager?.user_id?.toString() || "",
      });
    } else if (!user && open) {
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
      });
    }
  }, [user, open, form]);

  const onSubmit = async (values: CreateUserFormValues | UpdateUserFormValues) => {
    try {
      if (isEditMode) {
        const updateData = values as UpdateUserFormValues;
        await updateUser({
          id: user.user_id,
          data: updateData as UpdateUserRequest,
        }).unwrap();
        toast.success("User updated successfully");
      } else {
        const createData = values as CreateUserFormValues;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...userData } = createData;
        await createUser(userData as CreateUserRequest).unwrap();
        toast.success("User created successfully");
      }
      onSuccess();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update user information below."
              : "Fill in the form below to create a new user."}
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
                        className={form.formState.errors.time_zone ? "border-destructive" : ""}
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
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                              field.onChange(
                                currentRoles.filter((r) => r !== role.label)
                              );
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

