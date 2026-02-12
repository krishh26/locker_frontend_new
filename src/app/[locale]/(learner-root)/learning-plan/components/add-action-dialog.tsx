"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAddActionMutation, useEditActionMutation } from "@/store/api/learner-plan/learnerPlanApi";
import type { SessionActionDetail, EditActionRequest } from "@/store/api/learner-plan/types";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const actionSchema = z.object({
  actionName: z.string().min(1, "Action name is required"),
  actionDescription: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  targetDate: z.date({
    message: "Target date is required",
  }),
  onOffJob: z.string().optional(),
  who: z.enum(["learner", "assessor", "employer", "sessionLearner"], {
    message: "Please select an action type",
  }),
  unit: z.string().optional(),
});

const editActionSchema = z.object({
  actionDescription: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  targetDate: z.date().nullable().optional(),
  onOffJob: z.string().optional(),
  time_spent: z.number().nullable().optional(),
  trainer_feedback: z.string().nullable().optional(),
  learner_feedback: z.string().nullable().optional(),
  learner_status: z.string().optional(),
  status: z.string().optional(),
});

type ActionFormData = z.infer<typeof actionSchema>;
type EditActionFormData = z.infer<typeof editActionSchema>;

interface AddActionDialogProps {
  open: boolean;
  onClose: () => void;
  learnerPlanId: number;
  units: Array<{
    unit_id: string | number | null;
    unit_name: string | null;
  }>;
  onSuccess?: () => void;
  editAction?: SessionActionDetail | null;
  userRole?: string;
}

export function AddActionDialog({
  open,
  onClose,
  learnerPlanId,
  units,
  onSuccess,
  editAction,
  userRole,
}: AddActionDialogProps) {
  const [addAction, { isLoading: isAdding }] = useAddActionMutation();
  const [editActionMutation, { isLoading: isEditing }] = useEditActionMutation();
  
  const isEditMode = !!editAction;
  const isLoading = isAdding || isEditing;

  // Add mode form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      actionName: "",
      actionDescription: "",
      onOffJob: "Not-applicable",
      who: "learner",
      unit: "",
    },
  });

  // Edit mode form
  const {
    control: editControl,
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    reset: editReset,
    watch: editWatch,
  } = useForm<EditActionFormData>({
    resolver: zodResolver(editActionSchema),
    defaultValues: {
      actionDescription: editAction?.action_description || "",
      targetDate: editAction?.target_date ? new Date(editAction.target_date) : null,
      onOffJob: editAction?.job_type || "Not-applicable",
      time_spent: editAction?.time_spent || null,
      trainer_feedback: editAction?.trainer_feedback || null,
      learner_feedback: editAction?.learner_feedback || null,
      learner_status: editAction?.learner_status || "",
      status: typeof editAction?.status === "string" ? editAction.status : "",
    },
  });

  // Update edit form when editAction changes
  React.useEffect(() => {
    if (editAction && open) {
      editReset({
        actionDescription: editAction.action_description || "",
        targetDate: editAction.target_date ? new Date(editAction.target_date) : null,
        onOffJob: editAction.job_type || "Not-applicable",
        time_spent: editAction.time_spent || null,
        trainer_feedback: editAction.trainer_feedback || null,
        learner_feedback: editAction.learner_feedback || null,
        learner_status: editAction.learner_status || "",
        status: typeof editAction.status === "string" ? editAction.status : "",
      });
    } else if (!editAction && open) {
      reset();
      editReset({
        actionDescription: "",
        targetDate: null,
        onOffJob: "Not-applicable",
        time_spent: null,
        trainer_feedback: null,
        learner_feedback: null,
        learner_status: "",
        status: "",
      });
    }
  }, [editAction, open, reset, editReset]);

  const descriptionLength = watch("actionDescription")?.length || 0;
  const editDescriptionLength = editWatch("actionDescription")?.length || 0;

  const onSubmit = async (data: ActionFormData) => {
    const payload = {
      learner_plan_id: learnerPlanId,
      action_name: data.actionName,
      action_description: data.actionDescription || "",
      target_date: format(data.targetDate, "yyyy-MM-dd"),
      job_type: data.onOffJob || "Not-applicable",
      unit: data.unit || null,
      who: data.who,
    };

    try {
      await addAction(payload).unwrap();
      toast.success("Action added successfully");
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add action");
    }
  };

  const onEditSubmit = async (data: EditActionFormData) => {
    if (!editAction) return;

    const payload: EditActionRequest = {
      id: editAction.action_id,
      learner_plan_id: learnerPlanId,
      action_description: data.actionDescription || "",
      target_date: data.targetDate ? format(data.targetDate, "yyyy-MM-dd") : "",
      job_type: data.onOffJob || "Not-applicable",
      trainer_feedback: data.trainer_feedback || null,
      learner_feedback: data.learner_feedback || null,
    };

    if (data.time_spent !== null && data.time_spent !== undefined) {
      payload.time_spent = data.time_spent;
    }
    if (data.learner_status !== null && data.learner_status !== undefined && data.learner_status !== "") {
      payload.learner_status = data.learner_status;
    }
    if (data.status !== null && data.status !== undefined && data.status !== "") {
      payload.status = data.status;
    }

    try {
      await editActionMutation(payload).unwrap();
      toast.success("Action updated successfully");
      editReset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update action");
    }
  };

  const minDate = addDays(new Date(), 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Action" : "Add Action"}</DialogTitle>
        </DialogHeader>

        {isEditMode ? (
          <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-6 mt-6">
            {/* Action Description - Edit Mode */}
            <div className="space-y-2">
              <Label htmlFor="editActionDescription">Action Description</Label>
              <Controller
                name="actionDescription"
                control={editControl}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    id="editActionDescription"
                    placeholder="Enter action description"
                    rows={3}
                    className={editErrors.actionDescription ? "border-destructive" : ""}
                  />
                )}
              />
              <div className="flex justify-between">
                {editErrors.actionDescription ? (
                  <p className="text-sm text-destructive">
                    {editErrors.actionDescription.message}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Remaining characters: {1000 - editDescriptionLength}
                  </p>
                )}
              </div>
            </div>

            {/* Trainer Feedback - Edit Mode */}
            {(userRole === "Admin" || userRole === "Trainer") && (
              <div className="space-y-2">
                <Label htmlFor="trainerFeedback">Trainer Feedback</Label>
                <Controller
                  name="trainer_feedback"
                  control={editControl}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      id="trainerFeedback"
                      placeholder="Enter trainer feedback"
                      rows={2}
                    />
                  )}
                />
              </div>
            )}

            {/* Learner Feedback - Edit Mode */}
            {userRole === "Learner" && (
              <div className="space-y-2">
                <Label htmlFor="learnerFeedback">Learner Feedback</Label>
                <Controller
                  name="learner_feedback"
                  control={editControl}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      id="learnerFeedback"
                      placeholder="Enter learner feedback"
                      rows={2}
                    />
                  )}
                />
              </div>
            )}

            {/* Learner Status - Edit Mode (Learner only) */}
            {userRole === "Learner" && (
              <div className="space-y-2">
                <Label>Learner Status</Label>
                <Controller
                  name="learner_status"
                  control={editControl}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Target Date - Edit Mode */}
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Controller
                name="targetDate"
                control={editControl}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={(date) => field.onChange(date || null)}
                        disabled={(date) => date < minDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            {/* On/Off the Job - Edit Mode */}
            <div className="space-y-2">
              <Label>On/Off the Job</Label>
              <Controller
                name="onOffJob"
                control={editControl}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not-applicable">Not Applicable</SelectItem>
                      <SelectItem value="On-the-job">On the Job</SelectItem>
                      <SelectItem value="Off-the-job">Off the Job</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Time Spent - Edit Mode */}
            <div className="space-y-2">
              <Label htmlFor="timeSpent">Time Spent (minutes)</Label>
              <Controller
                name="time_spent"
                control={editControl}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="timeSpent"
                    type="number"
                    placeholder="Enter time spent in minutes"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                )}
              />
            </div>

            {/* Status - Edit Mode (Admin/Trainer only) */}
            {(userRole === "Admin" || userRole === "Trainer") && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={editControl}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Submit Button - Edit Mode */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Updating..." : "Update Action"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Action Name */}
          <div className="space-y-2">
            <Label htmlFor="actionName">Action name <span className="text-destructive">*</span></Label>
            <Controller
              name="actionName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="actionName"
                  placeholder="Enter action name"
                  className={errors.actionName ? "border-destructive" : ""}
                />
              )}
            />
            {errors.actionName && (
              <p className="text-sm text-destructive">
                {errors.actionName.message}
              </p>
            )}
          </div>

          {/* Action Description */}
          <div className="space-y-2">
            <Label htmlFor="actionDescription">Action Description</Label>
            <Controller
              name="actionDescription"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="actionDescription"
                  placeholder="Enter action description"
                  rows={3}
                  className={errors.actionDescription ? "border-destructive" : ""}
                />
              )}
            />
            <div className="flex justify-between">
              {errors.actionDescription ? (
                <p className="text-sm text-destructive">
                  {errors.actionDescription.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Remaining characters: {1000 - descriptionLength}
                </p>
              )}
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label>Target Date <span className="text-destructive">*</span></Label>
            <Controller
              name="targetDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => field.onChange(date || undefined)}
                      disabled={(date) => date < minDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.targetDate && (
              <p className="text-sm text-destructive">
                {errors.targetDate.message}
              </p>
            )}
          </div>

          {/* On/Off the Job */}
          <div className="space-y-2">
            <Label>On/Off the Job</Label>
            <Controller
              name="onOffJob"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not-applicable">Not Applicable</SelectItem>
                    <SelectItem value="On-the-job">On the Job</SelectItem>
                    <SelectItem value="Off-the-job">Off the Job</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Who */}
          <div className="space-y-2">
            <Label>Action</Label>
            <Controller
              name="who"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="assessor" id="assessor" />
                    <Label htmlFor="assessor" className="cursor-pointer">
                      Action myself
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="learner" id="learner" />
                    <Label htmlFor="learner" className="cursor-pointer">
                      Action Learner
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employer" id="employer" />
                    <Label htmlFor="employer" className="cursor-pointer">
                      Action employer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sessionLearner" id="sessionLearner" />
                    <Label htmlFor="sessionLearner" className="cursor-pointer">
                      Session Learner Action
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.who && (
              <p className="text-sm text-destructive">{errors.who.message}</p>
            )}
          </div>

          {/* Unit (Optional) */}
          <div className="space-y-2">
            <Label>Unit (Optional)</Label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(value) => field.onChange(value || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem
                        key={unit.unit_id}
                        value={String(unit.unit_id || "")}
                      >
                        {unit.unit_name || `Unit ${unit.unit_id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Submitting..." : "Submit"}
          </Button>

          {/* SMART Tip */}
          <div className="text-sm text-muted-foreground">
            Be SMART with your actions. Is your action Specific, Measurable,
            Achievable, Realistic and does it have a Target date?
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

