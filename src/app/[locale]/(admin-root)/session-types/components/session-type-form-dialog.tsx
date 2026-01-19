"use client";

import { useState, useEffect } from "react";
import { Clock, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateSessionTypeMutation,
  useUpdateSessionTypeMutation,
} from "@/store/api/session-type/sessionTypeApi";
import type { SessionType } from "@/store/api/session-type/types";
import { toast } from "sonner";

const sessionTypeSchema = z.object({
  name: z.string().min(1, "Session Type name is required"),
  isOffTheJob: z.boolean(),
  isActive: z.boolean(),
});

type SessionTypeFormData = z.infer<typeof sessionTypeSchema>;

interface SessionTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionType: SessionType | null;
  onSuccess: () => void;
}

export function SessionTypeFormDialog({
  open,
  onOpenChange,
  sessionType,
  onSuccess,
}: SessionTypeFormDialogProps) {
  const isEditMode = !!sessionType;

  const [createSessionType, { isLoading: isCreating }] =
    useCreateSessionTypeMutation();
  const [updateSessionType, { isLoading: isUpdating }] =
    useUpdateSessionTypeMutation();

  const form = useForm<SessionTypeFormData>({
    resolver: zodResolver(sessionTypeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      isOffTheJob: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (sessionType) {
      form.reset({
        name: sessionType.name,
        isOffTheJob: sessionType.isOffTheJob,
        isActive: sessionType.isActive,
      });
    } else {
      form.reset({
        name: "",
        isOffTheJob: false,
        isActive: true,
      });
    }
  }, [sessionType, form, open]);

  const handleSubmit = async (data: SessionTypeFormData) => {
    try {
      if (isEditMode && sessionType) {
        await updateSessionType({
          id: sessionType.id,
          payload: {
            name: data.name,
            is_off_the_job: data.isOffTheJob,
            active: data.isActive,
          },
        }).unwrap();
        toast.success("Session Type updated successfully");
      } else {
        await createSessionType({
          name: data.name,
          is_off_the_job: data.isOffTheJob,
          active: data.isActive,
        }).unwrap();
        toast.success("Session Type created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to save Session Type"
      );
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Session Type" : "Add Session Type"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the session type details"
              : "Create a new session type"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Session Type Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter session type name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOffTheJob"
                checked={form.watch("isOffTheJob")}
                onCheckedChange={(checked) =>
                  form.setValue("isOffTheJob", checked === true)
                }
              />
              <Label
                htmlFor="isOffTheJob"
                className="text-sm font-normal cursor-pointer"
              >
                Off the Job
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked)
                }
              />
              <Label
                htmlFor="isActive"
                className="text-sm font-normal cursor-pointer"
              >
                Active
              </Label>
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
            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
