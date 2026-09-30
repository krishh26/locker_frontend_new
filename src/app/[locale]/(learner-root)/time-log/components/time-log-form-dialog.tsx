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
import { useGetCourseQuery } from "@/store/api/course/courseApi";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

type TimeLogFormValues = {
  activity_date: string;
  activity_type: string;
  course_id?: string | null;
  unit?: string[];
  trainer_id?: string | null;
  type?: string;
  spend_time: string;
  start_time: string;
  end_time?: string;
  impact_on_learner: string;
  evidence_link?: string;
};

type CourseUnitOption = {
  id: string;
  title: string;
  code: string;
  ref: string;
};

const normalizeUnitKey = (value: string): string =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const compactUnitKey = (value: string): string =>
  normalizeUnitKey(value).replace(/[^a-z0-9]/g, "");

const toCourseUnitOption = (raw: unknown, index: number): CourseUnitOption | null => {
  if (raw == null) return null;
  if (typeof raw === "string" || typeof raw === "number") {
    const title = String(raw).trim();
    if (!title) return null;
    return { id: title, title, code: "", ref: "" };
  }
  if (typeof raw !== "object") return null;

  const u = raw as Record<string, unknown>;
  const id = String(
    u.id ?? u.unit_id ?? u._id ?? u.unitId ?? "",
  ).trim();
  const title = String(
    u.title ?? u.unit_title ?? u.name ?? u.unit_name ?? "",
  ).trim();
  const code = String(u.code ?? u.unit_code ?? "").trim();
  const ref = String(u.unit_ref ?? u.ref ?? u.reference ?? "").trim();
  const label = title || ref || code || id || `Unit ${index + 1}`;
  if (!label) return null;
  return {
    id: id || label,
    title: label,
    code,
    ref,
  };
};

const unitIdentityKeys = (unit: CourseUnitOption): string[] => {
  const values = [unit.title, unit.id, unit.code, unit.ref].filter(Boolean);
  const keys = new Set<string>();
  for (const value of values) {
    keys.add(normalizeUnitKey(value));
    const compact = compactUnitKey(value);
    if (compact) keys.add(compact);
  }
  return Array.from(keys);
};

const isUnitSelected = (
  selected: string[],
  unit: CourseUnitOption,
): boolean => {
  const keys = new Set(unitIdentityKeys(unit));
  return selected.some((value) => {
    const normalized = normalizeUnitKey(value);
    const compact = compactUnitKey(value);
    return keys.has(normalized) || (compact.length > 0 && keys.has(compact));
  });
};

/** Parse time-log unit field from API into string tokens. */
const parseTimeLogUnits = (unitField: TimeLogEntry["unit"]): string[] => {
  if (unitField == null || unitField === "") return [];

  const pushParsed = (item: unknown, out: string[]) => {
    if (item == null || item === "") return;
    if (Array.isArray(item)) {
      item.forEach((nested) => pushParsed(nested, out));
      return;
    }
    if (typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const label = String(
        obj.title ??
          obj.unit_title ??
          obj.name ??
          obj.unit_name ??
          obj.code ??
          obj.unit_code ??
          obj.unit_ref ??
          obj.id ??
          obj.unit_id ??
          obj._id ??
          "",
      ).trim();
      if (label) out.push(label);
      return;
    }
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) return;
      if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
      ) {
        try {
          pushParsed(JSON.parse(trimmed), out);
          return;
        } catch {
          // keep as plain string
        }
      }
      out.push(trimmed);
      return;
    }
    out.push(String(item).trim());
  };

  const result: string[] = [];
  pushParsed(unitField, result);
  return result.filter(Boolean);
};

const mapSelectedUnitsToTitles = (
  selected: string[],
  courseUnits: CourseUnitOption[],
): string[] => {
  if (!selected.length) return [];
  if (!courseUnits.length) return selected;

  const resolved: string[] = [];
  for (const value of selected) {
    const match = courseUnits.find((unit) => isUnitSelected([value], unit));
    const title = match?.title || value.trim();
    if (title && !resolved.includes(title)) {
      resolved.push(title);
    }
  }
  return resolved;
};

const collectUnitsFromUnknown = (rawUnits: unknown): CourseUnitOption[] => {
  if (!Array.isArray(rawUnits) || rawUnits.length === 0) return [];
  return rawUnits
    .map((raw, index) => toCourseUnitOption(raw, index))
    .filter((unit): unit is CourseUnitOption => Boolean(unit));
};

interface TimeLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeLog?: TimeLogEntry | null;
  editMode?: boolean;
  onSuccess?: () => void;
}

/** Black asterisk for required fields (stays black even when label is in error state). */
function RequiredMark() {
  return (
    <span className="ml-1 !text-black dark:!text-white" aria-hidden="true">
      *
    </span>
  );
}

/**
 * Toggle field visibility without deleting form code.
 * Set a key to `true` to show that field again later.
 */
const TIME_LOG_FORM_FIELD_VISIBILITY = {
  activityDate: true,
  spendTime: true,
  startTime: true,
  endTime: false, // still auto-calculated on submit
  activityType: true,
  course: true,
  unit: true,
  trainer: false,
  jobType: false, // defaults to "Not Applicable" when hidden
  impact: true,
  evidence: true,
} as const;

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

/** Normalize typed duration to HH:MM (e.g. "1:5" → "01:05"). */
const normalizeSpendTimeInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{1,3}):(\d{1,2})$/);
  if (!match) return trimmed;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
    return trimmed;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const isValidSpendTime = (value: string): boolean => {
  const normalized = normalizeSpendTimeInput(value);
  if (!/^\d{1,3}:\d{2}$/.test(normalized)) return false;
  const [, minutesPart] = normalized.split(":");
  const minutes = Number(minutesPart);
  return !Number.isNaN(minutes) && minutes <= 59 && timeToMinutes(normalized) > 0;
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

  const timeLogFormSchema = useMemo(
    () =>
      z.object({
        activity_date: z
          .string()
          .min(1, t("dialog.form.validation.activityDateRequired")),
        activity_type: z
          .string()
          .min(1, t("dialog.form.validation.activityTypeRequired")),
        course_id: z.string().nullable().optional(),
        unit: z.array(z.string()).optional(),
        trainer_id: z.string().nullable().optional(),
        type: z.string().optional(),
        spend_time: z
          .string()
          .min(1, t("dialog.form.validation.timeSpentRequired"))
          .refine(
            (val) => isValidSpendTime(val),
            t("dialog.form.validation.timeSpentInvalid"),
          ),
        start_time: z
          .string()
          .min(1, t("dialog.form.validation.startTimeRequired")),
        end_time: z.string().optional(),
        impact_on_learner: z
          .string()
          .min(1, t("dialog.form.validation.impactRequired")),
        evidence_link: z.string().optional(),
      }),
    [t],
  );

  const [createTimeLog, { isLoading: isCreating }] = useCreateTimeLogMutation();
  const [updateTimeLog, { isLoading: isUpdating }] = useUpdateTimeLogMutation();

  // Reuse learner courses from auth state (avoid extra cached course hook call)
  const learnerCourses = useAppSelector(selectCourses);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(
    { page: 1, page_size: 1000, role: "Trainer" },
    { skip: !open || !TIME_LOG_FORM_FIELD_VISIBILITY.trainer }
  );

  const courses = useMemo(
    () =>
      (learnerCourses || [])
        .map((courseItem) => {
          const item = courseItem as {
            course?: {
              course_id?: string | number;
              course_name?: string;
              units?: unknown[];
            };
            units?: unknown[];
          };
          const courseData =
            item.course ??
            (courseItem as unknown as {
              course_id?: string | number;
              course_name?: string;
              units?: unknown[];
            });
          if (!courseData?.course_id) return null;

          // Prefer non-empty unit lists — empty [] must not block fallback.
          const fromCourse = collectUnitsFromUnknown(courseData.units);
          const fromItem = collectUnitsFromUnknown(item.units);
          const units = fromCourse.length > 0 ? fromCourse : fromItem;

          return {
            course_id: String(courseData.course_id),
            course_name: courseData.course_name || "",
            units,
          };
        })
        .filter(
          (
            course,
          ): course is {
            course_id: string;
            course_name: string;
            units: CourseUnitOption[];
          } => Boolean(course),
        ),
    [learnerCourses],
  );
  const isLoadingCourses = false;
  const trainers = usersData?.data || [];

  const isLoading = isCreating || isUpdating;

  /** Select values must be strings — API often returns numeric course_id. */
  const normalizeCourseId = (
    courseId: TimeLogEntry["course_id"] | string | number | null | undefined,
  ): string | null => {
    if (courseId == null || courseId === "") return null;
    if (typeof courseId === "object") {
      const nested =
        courseId.course_id ??
        (courseId as { id?: string | number }).id ??
        null;
      if (nested == null || nested === "") return null;
      return String(nested);
    }
    return String(courseId);
  };

  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: {
      activity_date: "",
      activity_type: "",
      course_id: null,
      unit: [],
      trainer_id: null,
      type: "Not Applicable",
      spend_time: "",
      start_time: "00:00",
      end_time: "00:00",
      impact_on_learner: "",
      evidence_link: "",
    },
  });

  const watchedCourseId = form.watch("course_id");
  const courseIdNumber = watchedCourseId ? Number(watchedCourseId) : NaN;

  const { data: courseDetailResponse } = useGetCourseQuery(courseIdNumber, {
    skip: !open || !watchedCourseId || Number.isNaN(courseIdNumber),
  });

  const selectedCourse = useMemo(() => {
    const fromLearner = courses.find(
      (c) => String(c.course_id) === String(watchedCourseId ?? ""),
    );
    const detailUnits = collectUnitsFromUnknown(
      (courseDetailResponse?.data as { units?: unknown[] } | undefined)?.units,
    );
    if (!fromLearner && !watchedCourseId) return undefined;
    if (!fromLearner) {
      return {
        course_id: String(watchedCourseId),
        course_name:
          (courseDetailResponse?.data as { course_name?: string } | undefined)
            ?.course_name || "",
        units: detailUnits,
      };
    }
    return {
      ...fromLearner,
      units: detailUnits.length > 0 ? detailUnits : fromLearner.units,
    };
  }, [courses, watchedCourseId, courseDetailResponse?.data]);

  const availableUnits = selectedCourse?.units;

  useEffect(() => {
    if (timeLog && editMode) {
      const courseId = normalizeCourseId(timeLog.course_id);

      const trainerId =
        typeof timeLog.trainer_id === "object" && timeLog.trainer_id
          ? String(timeLog.trainer_id.user_id)
          : timeLog.trainer_id != null && timeLog.trainer_id !== ""
            ? String(timeLog.trainer_id)
            : null;

      form.reset({
        activity_date: timeLog.activity_date?.substring(0, 10) || "",
        activity_type: timeLog.activity_type || "",
        course_id: courseId,
        unit: parseTimeLogUnits(timeLog.unit),
        trainer_id: trainerId,
        type: timeLog.type || "Not Applicable",
        spend_time: timeLog.spend_time || "",
        start_time: timeLog.start_time || "00:00",
        end_time: timeLog.end_time || "00:00",
        impact_on_learner: timeLog.impact_on_learner || "",
        evidence_link: timeLog.evidence_link || "",
      });
    } else if (!editMode) {
      form.reset({
        activity_date: "",
        activity_type: "",
        course_id: null,
        unit: [],
        trainer_id: null,
        type: "Not Applicable",
        spend_time: "",
        start_time: "00:00",
        end_time: "00:00",
        impact_on_learner: "",
        evidence_link: "",
      });
    }
  }, [timeLog, editMode, form, open]);

  // Rematch saved unit ids/codes/refs to course unit titles once units are available.
  useEffect(() => {
    if (!open || !editMode || !timeLog) return;
    if (!availableUnits?.length) return;

    const resolved = mapSelectedUnitsToTitles(
      parseTimeLogUnits(timeLog.unit),
      availableUnits,
    );
    const current = form.getValues("unit") || [];
    const same =
      resolved.length === current.length &&
      resolved.every((title, index) => title === current[index]);
    if (!same) {
      form.setValue("unit", resolved, { shouldDirty: false });
    }
  }, [open, editMode, timeLog, availableUnits, form]);

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
      const normalizedSpendTime = normalizeSpendTimeInput(data.spend_time);
      // Always derive end time from start + spend (field is hidden from the form UI).
      const derivedEndTime =
        data.start_time &&
        normalizedSpendTime &&
        data.start_time !== "00:00" &&
        normalizedSpendTime !== "00:00"
          ? calculateEndTime(data.start_time, normalizedSpendTime)
          : data.end_time || "00:00";

      const payload: TimeLogCreateRequest = {
        user_id: userId,
        course_id: data.course_id || null,
        activity_date: data.activity_date,
        activity_type: data.activity_type,
        unit: data.unit || [],
        trainer_id: data.trainer_id || null,
        type: data.type || "Not Applicable",
        spend_time: normalizedSpendTime,
        start_time: data.start_time,
        end_time: derivedEndTime,
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
  ];

  const unitOptions = availableUnits ?? [];

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 *:min-w-0">
              {TIME_LOG_FORM_FIELD_VISIBILITY.activityDate && (
                <FormField
                  control={form.control}
                  name="activity_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("dialog.form.fields.activityDate.label")}
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.spendTime && (
                <FormField
                  control={form.control}
                  name="spend_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("dialog.form.fields.spendTime.label")}
                        <RequiredMark />
                      </FormLabel>
                      <FormControl className="w-full">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder={t(
                            "dialog.form.fields.spendTime.placeholder",
                          )}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleTimeChange("spend_time", e.target.value);
                          }}
                          onBlur={(e) => {
                            const normalized = normalizeSpendTimeInput(
                              e.target.value,
                            );
                            field.onChange(normalized);
                            field.onBlur();
                            handleTimeChange("spend_time", normalized);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.startTime && (
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("dialog.form.fields.startTime.label")}
                        <RequiredMark />
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
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.endTime && (
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("dialog.form.fields.endTime.label")}
                        <RequiredMark />
                      </FormLabel>
                      <FormControl className="w-full">
                        <Input type="time" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.activityType && (
                <FormField
                  control={form.control}
                  name="activity_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("dialog.form.fields.activityType.label")}
                        <RequiredMark />
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl className="w-full">
                          <SelectTrigger className="w-full min-w-0 cursor-pointer">
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
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.course && (
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
                          const next = value === "none" ? null : value;
                          const prev = field.value ? String(field.value) : null;
                          field.onChange(next);
                          // Only clear units when the user actually changes course
                          if (next !== prev) {
                            form.setValue("unit", []);
                          }
                        }}
                        value={field.value ? String(field.value) : "none"}
                      >
                        <FormControl className="w-full">
                          <SelectTrigger
                            className="w-full min-w-0 cursor-pointer"
                            title={selectedCourse?.course_name}
                          >
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
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.unit && (
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => {
                    const currentUnits = field.value || [];
                    const orphanUnits = currentUnits.filter(
                      (value) =>
                        !unitOptions.some((unit) =>
                          isUnitSelected([value], unit),
                        ),
                    );

                    const toggleUnit = (unit: CourseUnitOption) => {
                      if (isUnitSelected(currentUnits, unit)) {
                        const keys = new Set(unitIdentityKeys(unit));
                        field.onChange(
                          currentUnits.filter((value) => {
                            const normalized = normalizeUnitKey(value);
                            const compact = compactUnitKey(value);
                            return (
                              !keys.has(normalized) &&
                              !(compact && keys.has(compact))
                            );
                          }),
                        );
                      } else {
                        field.onChange([...currentUnits, unit.title]);
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>
                          {t("dialog.form.fields.unit.label")}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full min-w-0 justify-between font-normal"
                                disabled={!watchedCourseId}
                              >
                                <span className="truncate">
                                  {currentUnits.length > 0
                                    ? t(
                                        "dialog.form.fields.unit.placeholderWithCount",
                                        { count: currentUnits.length },
                                      )
                                    : t(
                                        "dialog.form.fields.unit.placeholderDefault",
                                      )}
                                </span>
                                <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-2"
                            align="start"
                          >
                            <div className="max-h-60 space-y-1 overflow-y-auto">
                              {orphanUnits.map((orphan) => (
                                <label
                                  key={`orphan-${orphan}`}
                                  className="flex cursor-pointer items-center gap-2 rounded-sm p-2 hover:bg-muted"
                                >
                                  <Checkbox
                                    checked
                                    onCheckedChange={() => {
                                      field.onChange(
                                        currentUnits.filter((u) => u !== orphan),
                                      );
                                    }}
                                  />
                                  <span className="text-sm break-words">
                                    {orphan}
                                  </span>
                                </label>
                              ))}
                              {unitOptions.length > 0 ? (
                                unitOptions.map((unit) => (
                                  <label
                                    key={unit.id}
                                    className="flex cursor-pointer items-center gap-2 rounded-sm p-2 hover:bg-muted"
                                  >
                                    <Checkbox
                                      checked={isUnitSelected(
                                        currentUnits,
                                        unit,
                                      )}
                                      onCheckedChange={() => toggleUnit(unit)}
                                    />
                                    <span className="text-sm break-words">
                                      {unit.title}
                                    </span>
                                  </label>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-muted-foreground">
                                  {t("dialog.form.fields.unit.noUnits")}
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.trainer && (
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
                          <SelectTrigger className="w-full min-w-0 cursor-pointer">
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
              )}

              {TIME_LOG_FORM_FIELD_VISIBILITY.jobType && (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("dialog.form.fields.type.label")}
                        <RequiredMark />
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl className="w-full">
                          <SelectTrigger className="w-full min-w-0 cursor-pointer">
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
              )}
            </div>

            {TIME_LOG_FORM_FIELD_VISIBILITY.impact && (
              <FormField
                control={form.control}
                name="impact_on_learner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dialog.form.fields.impact.label")}
                      <RequiredMark />
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
            )}

            {TIME_LOG_FORM_FIELD_VISIBILITY.evidence && (
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
            )}

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
