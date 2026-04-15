"use client";

import { useEffect, useCallback, useMemo } from "react";
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
import { selectCourses } from "@/store/slices/authSlice";
import { useGetUsersQuery } from "@/store/api/user/userApi";
import { useTranslations } from "next-intl";

const timeLogFormSchema = z.object({
  activity_date: z.string().min(1, "validation.activityDateRequired"),
  activity_type: z.string().min(1, "validation.activityTypeRequired"),
  course_id: z.string().nullable().optional(),
  unit: z.array(z.string()).optional(),
  trainer_id: z.string().nullable().optional(),
  type: z.string().min(1, "validation.jobTypeRequired"),
  spend_time: z.string().min(1, "validation.timeSpentRequired"),
  start_time: z.string().min(1, "validation.startTimeRequired"),
  end_time: z.string().min(1, "validation.endTimeRequired"),
  impact_on_learner: z.string().min(1, "validation.impactRequired"),
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
  const t = useTranslations("timeLog");

  const [createTimeLog, { isLoading: isCreating }] = useCreateTimeLogMutation();
  const [updateTimeLog, { isLoading: isUpdating }] = useUpdateTimeLogMutation();

  // Reuse learner courses from auth state (avoid extra cached course hook call)
  const learnerCourses = useAppSelector(selectCourses);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(
    { page: 1, page_size: 1000, role: "Trainer" },
    { skip: !open }
  );

  const courses = useMemo(
    () =>
      (learnerCourses || [])
        .map((courseItem) => {
          const course = (courseItem as { course?: unknown; units?: unknown }).course || courseItem;
          const courseData = course as {
            course_id?: string | number;
            course_name?: string;
            units?: { id: string; title: string }[];
          };
          if (!courseData?.course_id) return null;
          return {
            course_id: String(courseData.course_id),
            course_name: courseData.course_name || "",
            units: Array.isArray(courseData.units) ? courseData.units : [],
          };
        })
        .filter((course): course is { course_id: string; course_name: string; units: { id: string; title: string }[] } => Boolean(course)),
    [learnerCourses]
  );
  const isLoadingCourses = false;
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
        toast.success(t("toast.updateSuccess"));
      } else {
        await createTimeLog(payload).unwrap();
        toast.success(t("toast.createSuccess"));
      }

      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(
        errorMessage ||
          (editMode ? t("toast.updateFailed") : t("toast.createFailed"))
      );
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
          <DialogTitle>
            {editMode
              ? t("dialog.form.title.edit")
              : t("dialog.form.title.create")}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? t("dialog.form.description.edit")
              : t("dialog.form.description.create")}
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
                    <FormLabel>
                      {t("dialog.form.fields.activityDate.label")}
                    </FormLabel>
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
                    <FormLabel>
                      {t("dialog.form.fields.activityType.label")}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue
                            placeholder={t(
                              "dialog.form.fields.activityType.placeholder"
                            )}
                          />
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
                    <FormLabel>
                      {t("dialog.form.fields.course.label")}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                        form.setValue("unit", []); // Reset units when course changes
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue
                            placeholder={t("dialog.form.fields.course.label")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          {t("dialog.form.fields.course.noneOption")}
                        </SelectItem>
                        {isLoadingCourses ? (
                          <SelectItem value="loading" disabled>
                            {t("dialog.form.fields.course.loading")}
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
                    <FormLabel>
                      {t("dialog.form.fields.unit.label")}
                    </FormLabel>
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
                      <FormControl className="w-full">
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue
                            placeholder={
                              selectedUnits.length > 0
                                ? t(
                                    "dialog.form.fields.unit.placeholderWithCount",
                                    { count: selectedUnits.length }
                                  )
                                : t(
                                    "dialog.form.fields.unit.placeholderDefault"
                                  )
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(() => {
                          const units = (selectedCourse as { units?: { id: string; title: string }[] } | undefined)?.units;
                          return units && units.length > 0 ? (
                          units.map((unit) => (
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
                              {t("dialog.form.fields.unit.noUnits")}
                            </div>
                          );
                        })()}
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
                    <FormLabel>
                      {t("dialog.form.fields.trainer.label")}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue
                            placeholder={t(
                              "dialog.form.fields.trainer.label"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          {t("dialog.form.fields.trainer.noneOption")}
                        </SelectItem>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>
                            {t("dialog.form.fields.trainer.loading")}
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
                    <FormLabel>
                      {t("dialog.form.fields.type.label")}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue
                            placeholder={t(
                              "dialog.form.fields.type.placeholder"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Not Applicable">
                          {t("dialog.form.fields.type.options.notApplicable")}
                        </SelectItem>
                        <SelectItem value="On the job">
                          {t("dialog.form.fields.type.options.on")}
                        </SelectItem>
                        <SelectItem value="Off the job">
                          {t("dialog.form.fields.type.options.off")}
                        </SelectItem>
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
                    <FormLabel>
                      {t("dialog.form.fields.spendTime.label")}
                    </FormLabel>
                    <FormControl className="w-full">
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
                    <FormLabel>
                      {t("dialog.form.fields.startTime.label")}
                    </FormLabel>
                    <FormControl className="w-full">
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
                    <FormLabel>
                      {t("dialog.form.fields.endTime.label")}
                    </FormLabel>
                    <FormControl className="w-full">
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
                    {t("dialog.form.fields.impact.label")}
                  </FormLabel>
                  <FormControl className="w-full">
                    <Textarea
                      placeholder={t(
                        "dialog.form.fields.impact.placeholder"
                      )}
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
                  <FormLabel>
                    {t("dialog.form.fields.evidence.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "dialog.form.fields.evidence.placeholder"
                      )}
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
                {t("dialog.form.buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? editMode
                    ? t("dialog.form.buttons.loadingUpdate")
                    : t("dialog.form.buttons.loadingCreate")
                  : editMode
                  ? t("dialog.form.buttons.saveUpdate")
                  : t("dialog.form.buttons.saveCreate")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
