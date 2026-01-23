"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";

const createAdminSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    user_name: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    status: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const updateAdminSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  user_name: z.string().min(1, "Username is required").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required").optional(),
  status: z.string().optional(),
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;
type UpdateAdminFormValues = z.infer<typeof updateAdminSchema>;

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_name: string;
    status?: string;
  } | null;
  onSuccess: () => void;
}

export function AdminFormDialog({
  open,
  onOpenChange,
  admin,
  onSuccess,
}: AdminFormDialogProps) {
  const isEditMode = !!admin;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateAdminFormValues | UpdateAdminFormValues>({
    resolver: zodResolver(isEditMode ? updateAdminSchema : createAdminSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      user_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (admin && open) {
      form.reset({
        first_name: admin.first_name,
        last_name: admin.last_name,
        user_name: admin.user_name,
        email: admin.email,
        status: admin.status || "active",
      });
    } else if (!admin && open) {
      form.reset({
        first_name: "",
        last_name: "",
        user_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        status: "active",
      });
    }
  }, [admin, open, form]);

  const onSubmit = async (values: CreateAdminFormValues | UpdateAdminFormValues) => {
    setIsLoading(true);
    try {
      // Placeholder API call - will be replaced with actual mutation
      if (isEditMode) {
        // await updateAdmin({ id: admin.user_id, data: values }).unwrap();
        toast.success("Admin updated successfully");
      } else {
        // await createAdmin(values).unwrap();
        toast.success("Admin created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditMode ? "Failed to update admin" : "Failed to create admin");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Admin" : "Create Admin"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update administrator account details"
              : "Create a new administrator account. The role will be set to Admin automatically."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...form.register("first_name")}
                disabled={isLoading}
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...form.register("last_name")}
                disabled={isLoading}
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user_name">Username</Label>
              <Input
                id="user_name"
                {...form.register("user_name")}
                disabled={isLoading}
              />
              {form.formState.errors.user_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.user_name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            {!isEditMode && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...form.register("password")}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...form.register("confirmPassword")}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status") || "active"}
                onValueChange={(value) => form.setValue("status", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
