"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useSendBroadcastMessageMutation,
} from "@/store/api/broadcast/broadcastApi";
import { useGetUsersQuery } from "@/store/api/user/userApi";
import type { Broadcast } from "@/store/api/broadcast/types";
import { toast } from "sonner";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";

const broadcastMessageSchema = z
  .object({
    target: z.enum([
      "All",
      "All Learner",
      "All EQA",
      "All Trainer",
      "All Employer",
      "All IQA",
      "All LIQA",
      "Individual",
      "qualification",
    ]),
    user_ids: z.array(z.number()).optional(),
    course_ids: z.array(z.number()).optional(),
  })
  .refine(
    (data) => {
      if (data.target === "Individual") {
        return data.user_ids && data.user_ids.length > 0;
      }
      if (data.target === "qualification") {
        return data.course_ids && data.course_ids.length > 0;
      }
      return true;
    },
    {
      message: "Please select at least one user or course",
      path: ["user_ids"],
    }
  );

type BroadcastMessageFormValues = z.infer<typeof broadcastMessageSchema>;

interface BroadcastMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broadcast: Broadcast | null;
  onSuccess: () => void;
}

export function BroadcastMessageDialog({
  open,
  onOpenChange,
  broadcast,
  onSuccess,
}: BroadcastMessageDialogProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  const [sendBroadcastMessage, { isLoading: isSending }] =
    useSendBroadcastMessageMutation();

  // Fetch all users for Individual selection
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({
    page: 1,
    page_size: 1000, // Large page size to get all users
  });

  // Fetch courses for qualification selection
  const { data: coursesData, isLoading: isLoadingCourses } = useCachedCoursesList({
    skip: selectedTarget !== "qualification",
  });

  const form = useForm<BroadcastMessageFormValues>({
    resolver: zodResolver(broadcastMessageSchema),
    defaultValues: {
      target: "All",
      user_ids: [],
      course_ids: [],
    },
  });

  useEffect(() => {
    if (open) {
      setSelectedTarget("");
      setSelectedUserIds([]);
      setSelectedCourseIds([]);
      form.reset({
        target: "All",
        user_ids: [],
        course_ids: [],
      });
    }
  }, [open, form]);

  const handleTargetChange = (value: string) => {
    setSelectedTarget(value);
    setSelectedUserIds([]);
    setSelectedCourseIds([]);
      form.setValue("target", value as BroadcastMessageFormValues["target"]);
    form.setValue("user_ids", []);
    form.setValue("course_ids", []);
  };

  const userOptions: Option[] = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.map((user) => ({
      value: user.user_id.toString(),
      label: user.user_name || `${user.first_name} ${user.last_name}`,
    }));
  }, [usersData]);

  const courseOptions: Option[] = useMemo(() => {
    if (!coursesData?.data) return [];
    return coursesData.data.map((course) => ({
      value: course.course_id.toString(),
      label: course.course_name,
    }));
  }, [coursesData]);

  const handleUserSelection = (options: Option[]) => {
    const ids = options.map((opt) => parseInt(opt.value));
    setSelectedUserIds(ids);
    form.setValue("user_ids", ids);
  };

  const handleCourseSelection = (options: Option[]) => {
    const ids = options.map((opt) => parseInt(opt.value));
    setSelectedCourseIds(ids);
    form.setValue("course_ids", ids);
  };

  const onSubmit = async (values: BroadcastMessageFormValues) => {
    if (!broadcast) return;

    try {
      const payload: {
        title: string;
        description: string;
        assign?: "All" | "All Learner" | "All EQA" | "All Trainer" | "All Employer" | "All IQA" | "All LIQA";
        user_ids?: number[];
        course_ids?: number[];
      } = {
        title: broadcast.title,
        description: broadcast.description,
      };

      if (values.target === "Individual") {
        payload.user_ids = values.user_ids;
      } else if (values.target === "qualification") {
        payload.course_ids = values.course_ids;
      } else {
        payload.assign = values.target as "All" | "All Learner" | "All EQA" | "All Trainer" | "All Employer" | "All IQA" | "All LIQA";
      }

      await sendBroadcastMessage(payload).unwrap();
      toast.success("Broadcast message sent successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to send broadcast message");
    }
  };

  if (!broadcast) return null;

  const isFormValid =
    selectedTarget &&
    (selectedTarget === "Individual"
      ? selectedUserIds.length > 0
      : selectedTarget === "qualification"
      ? selectedCourseIds.length > 0
      : true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Broadcast Message</DialogTitle>
          <DialogDescription>
            Select the target audience for this broadcast message.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Broadcast Info (Read-only) */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-semibold">Title:</Label>
              <p className="text-sm">{broadcast.title}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Description:</Label>
              <p className="text-sm">{broadcast.description}</p>
            </div>
          </div>

          {/* Target Selection */}
          <div className="space-y-4">
            <Label>Broadcast Message to users</Label>
            <Controller
              name="target"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleTargetChange(value);
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="All" id="all" />
                      <Label htmlFor="all" className="cursor-pointer">
                        All
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="All Learner" id="all-learner" />
                      <Label htmlFor="all-learner" className="cursor-pointer">
                        All Learner
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="All EQA" id="all-eqa" />
                      <Label htmlFor="all-eqa" className="cursor-pointer">
                        All EQA
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="All Trainer" id="all-trainer" />
                      <Label htmlFor="all-trainer" className="cursor-pointer">
                        All Trainer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="All Employer" id="all-employer" />
                      <Label htmlFor="all-employer" className="cursor-pointer">
                        All Employer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="All IQA" id="all-iqa" />
                      <Label htmlFor="all-iqa" className="cursor-pointer">
                        All IQA
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="All LIQA" id="all-liqa" />
                      <Label htmlFor="all-liqa" className="cursor-pointer">
                        All LIQA
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Individual" id="individual" />
                      <Label htmlFor="individual" className="cursor-pointer">
                        Individual
                      </Label>
                    </div>
                    {selectedTarget === "Individual" && (
                      <div className="ml-6 space-y-2">
                        <Label>Select Users</Label>
                        {isUsersLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Loading users...
                            </span>
                          </div>
                        ) : (
                          <MultipleSelector
                            value={userOptions.filter((opt) =>
                              selectedUserIds.includes(parseInt(opt.value))
                            )}
                            options={userOptions}
                            onChange={handleUserSelection}
                            placeholder="Select users"
                            emptyIndicator={
                              <p className="text-center text-sm text-muted-foreground">
                                No users found.
                              </p>
                            }
                          />
                        )}
                        {form.formState.errors.user_ids && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.user_ids.message}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="qualification" id="qualification" />
                      <Label htmlFor="qualification" className="cursor-pointer">
                        Qualification
                      </Label>
                    </div>
                    {selectedTarget === "qualification" && (
                      <div className="ml-6 space-y-2">
                        <Label>Select Courses</Label>
                        {isLoadingCourses ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Loading courses...
                            </span>
                          </div>
                        ) : courseOptions.length > 0 ? (
                          <MultipleSelector
                            value={courseOptions.filter((opt) =>
                              selectedCourseIds.includes(parseInt(opt.value))
                            )}
                            options={courseOptions}
                            onChange={handleCourseSelection}
                            placeholder="Select courses"
                            emptyIndicator={
                              <p className="text-center text-sm text-muted-foreground">
                                No courses found.
                              </p>
                            }
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Course selection will be available once the course API is
                            integrated.
                          </p>
                        )}
                        {form.formState.errors.course_ids && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.course_ids.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </RadioGroup>
              )}
            />
            {form.formState.errors.target && (
              <p className="text-sm text-destructive">
                {form.formState.errors.target.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSending || !isFormValid}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Broadcast
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

