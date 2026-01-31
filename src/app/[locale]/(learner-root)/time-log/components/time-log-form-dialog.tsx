"use client";

import { useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateTimeLogMutation,
  useUpdateTimeLogMutation,
} from "@/store/api/time-log/timeLogApi";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import type { TimeLogEntry, TimeLogCreateRequest } from "@/store/api/time-log/types";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import { useGetUsersQuery } from "@/store/api/user/userApi";

const timeLogFormSchema = z.object({
  activity_date: z.string().min(1, "Activity date is required"),
  activity_type: z.string().min(1, "Activity type is required"),
  course_id: z.string().nullable().optional(),
  unit: z.array(z.string()).optional(),
  trainer_id: z.string().nullable().optional(),
  type: z.string().min(1, "Job type is required"),
  spend_time: z.string().min(1, "Time spent is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  impact_on_learner: z.string().min(1, "Impact on learner is required"),
  evidence_link: z.string().optional(),
});

type TimeLogFormValues = z.infer<typeof timeLogFormSchema>;

interface TimeLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeLog?: TimeLogEntry | null;
  editMode?: boolean;
  onSuccess?: () => void;
}

// Time conversion helpers
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr === "0:0" || timeStr === "00:00") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const minutesToTime = (totalMinutes: number): string => {
  if (totalMinutes < 0) return "00:00";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const calculateEndTime = (startTime: string, spendTime: string): string => {
  if (!startTime || startTime === "0:0" || startTime === "00:00") return "";
  if (!spendTime || spendTime === "0:0" || spendTime === "00:00") return "";

  const startMinutes = timeToMinutes(startTime);
  const spendMinutes = timeToMinutes(spendTime);
  const endMinutes = startMinutes + spendMinutes;

  const maxMinutesInDay = 24 * 60;
  const finalMinutes = endMinutes % maxMinutesInDay;

  return minutesToTime(finalMinutes);
};

export function TimeLogFormDialog({
  open,
  onOpenChange,
  timeLog,
  editMode = false,
  onSuccess,
}: TimeLogFormDialogProps) {
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id || "";

  const [createTimeLog, { isLoading: isCreating }] = useCreateTimeLogMutation();
  const [updateTimeLog, { isLoading: isUpdating }] = useUpdateTimeLogMutation();

  // Fetch courses and trainers
  const { data: coursesData, isLoading: isLoadingCourses } = useCachedCoursesList({ skip: !open });
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(
    { page: 1, page_size: 1000, role: "Trainer" },
    { skip: !open }
  );

  const courses = coursesData?.data || [];
  const trainers = usersData?.data || [];

  const isLoading = isCreating || isUpdating;

  // Extract unit value from timeLog
  const getUnitValue = (timeLog: TimeLogEntry | null | undefined): string[] => {
    if (!timeLog?.unit) return [];
    if (Array.isArray(timeLog.unit)) return timeLog.unit;
    return [timeLog.unit];
  };

  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: {
      activity_date: "",
      activity_type: "",
      course_id: null,
      unit: [],
      trainer_id: null,
      type: "",
      spend_time: "00:00",
      start_time: "00:00",
      end_time: "00:00",
      impact_on_learner: "",
      evidence_link: "",
    },
  });

  useEffect(() => {
    if (timeLog && editMode) {
      const courseId =
        typeof timeLog.course_id === "object" && timeLog.course_id
          ? timeLog.course_id.course_id
          : timeLog.course_id || null;

      const trainerId =
        typeof timeLog.trainer_id === "object" && timeLog.trainer_id
          ? timeLog.trainer_id.user_id
          : timeLog.trainer_id || null;

      form.reset({
        activity_date: timeLog.activity_date?.substring(0, 10) || "",
        activity_type: timeLog.activity_type || "",
        course_id: courseId,
        unit: getUnitValue(timeLog),
        trainer_id: trainerId,
        type: timeLog.type || "",
        spend_time: timeLog.spend_time || "00:00",
        start_time: timeLog.start_time || "00:00",
        end_time: timeLog.end_time || "00:00",
        impact_on_learner: timeLog.impact_on_learner || "",
        evidence_link: timeLog.evidence_link || "",
      });
    } else {
      form.reset({
        activity_date: "",
        activity_type: "",
        course_id: null,
        unit: [],
        trainer_id: null,
        type: "",
        spend_time: "00:00",
        start_time: "00:00",
        end_time: "00:00",
        impact_on_learner: "",
        evidence_link: "",
      });
    }
  }, [timeLog, editMode, form]);

  const handleTimeChange = useCallback(
    (field: "start_time" | "spend_time", value: string) => {
      form.setValue(field, value);
      const startTime = field === "start_time" ? value : form.getValues("start_time");
      const spendTime = field === "spend_time" ? value : form.getValues("spend_time");

      if (startTime && spendTime && startTime !== "00:00" && spendTime !== "00:00") {
        const calculatedEndTime = calculateEndTime(startTime, spendTime);
        if (calculatedEndTime) {
          form.setValue("end_time", calculatedEndTime);
        }
      }
    },
    [form]
  );

  async function onSubmit(data: TimeLogFormValues) {
    try {
      const payload: TimeLogCreateRequest = {
        user_id: userId,
        course_id: data.course_id || null,
        activity_date: data.activity_date,
        activity_type: data.activity_type,
        unit: data.unit || [],
        trainer_id: data.trainer_id || null,
        type: data.type,
        spend_time: data.spend_time,
        start_time: data.start_time,
        end_time: data.end_time,
        impact_on_learner: data.impact_on_learner,
        evidence_link: data.evidence_link,
      };

      if (editMode && timeLog?.id) {
        await updateTimeLog({
          id: timeLog.id,
          ...payload,
        }).unwrap();
        toast.success("Time log updated successfully");
      } else {
        await createTimeLog(payload).unwrap();
        toast.success("Time log created successfully");
      }

      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(errorMessage || `Failed to ${editMode ? "update" : "create"} time log`);
    }
  }

  const activityTypes = [
    "Virtual Training Session",
    "Traditional face-to-face session",
    "Trainer or assessor led training",
    "Electronic or distance learning, or self-study",
    "Coaching or mentoring",
    "Guided learning with no trainer/assessor present",
    "Gaining technical experience by doing my job",
    "Review/feedback/support",
    "Assessment or examination",
    "Other",
    "Furloughed",
  ];

  const selectedCourse = courses.find(
    (c) => String(c.course_id) === form.watch("course_id")
  );
  const selectedUnits = form.watch("unit") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Time Log" : "Add Activity"}</DialogTitle>
          <DialogDescription>
            {editMode
              ? "Update the time log entry details."
              : "Fill in the details to create a new time log entry."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. Select Activity Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2. Select Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Select Activity Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3. Select Course</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                        form.setValue("unit", []); // Reset units when course changes
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {isLoadingCourses ? (
                          <SelectItem value="loading" disabled>
                            Loading courses...
                          </SelectItem>
                        ) : (
                          courses.map((course) => (
                            <SelectItem key={course.course_id} value={String(course.course_id)}>
                              {course.course_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>4. Select Unit</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const currentUnits = field.value || [];
                        if (currentUnits.includes(value)) {
                          field.onChange(currentUnits.filter((u) => u !== value));
                        } else {
                          field.onChange([...currentUnits, value]);
                        }
                      }}
                      value=""
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue
                            placeholder={
                              selectedUnits.length > 0
                                ? `${selectedUnits.length} unit(s) selected`
                                : "Select Unit(s)"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedCourse?.units && selectedCourse.units.length > 0 ? (
                          selectedCourse.units.map((unit: { id: string; title: string }) => (
                            <div key={unit.id} className="flex items-center space-x-2 p-2">
                              <Checkbox
                                checked={selectedUnits.includes(unit.title)}
                                onCheckedChange={() => {
                                  const currentUnits = field.value || [];
                                  if (currentUnits.includes(unit.title)) {
                                    field.onChange(
                                      currentUnits.filter((u) => u !== unit.title)
                                    );
                                  } else {
                                    field.onChange([...currentUnits, unit.title]);
                                  }
                                }}
                              />
                              <label className="text-sm">{unit.title}</label>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            No units available for selected course
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>5. Select Trainer</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Select Trainer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>
                            Loading trainers...
                          </SelectItem>
                        ) : (
                          trainers.map((trainer) => (
                            <SelectItem key={trainer.user_id} value={String(trainer.user_id)}>
                              {trainer.user_name || `${trainer.first_name} ${trainer.last_name}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6. Was it on the Job?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Select Job Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                        <SelectItem value="On the job">On the job</SelectItem>
                        <SelectItem value="Off the job">Off the job</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spend_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>7. Time Spent on Activity</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleTimeChange("spend_time", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>8. Activity Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleTimeChange("start_time", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>9. Activity End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="impact_on_learner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    10. What impact has this activity had on your learning?
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please type in any impact notes."
                      className="resize-none"
                      rows={7}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidence_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>11. Evidence Links</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter evidence link"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isLoading
                  ? editMode
                    ? "Updating..."
                    : "Creating..."
                  : editMode
                  ? "Update Time Log"
                  : "Save Time Log"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
