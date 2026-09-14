/**
 * Background autosave for Course Builder step 1 (units/modules).
 * Debounces dirty changes, runs a 2-minute safety interval, and saves when the tab hides.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
} from "react-hook-form";
import { toast } from "sonner";
import type { CourseFormData, CourseCoreType } from "@/store/api/course/types";
import { useUpdateCourseMutation } from "@/store/api/course/courseApi";
import { removeEmptyStrings } from "../constants/course-constants";

const DEBOUNCE_MS = 45_000;
const INTERVAL_MS = 120_000;
const FAILURE_TOAST_THRESHOLD = 2;

export type CourseAutosaveStatus = "idle" | "saving" | "saved" | "error";

type UseCourseAutosaveOptions = {
  enabled: boolean;
  courseId: string | null;
  courseCoreType: CourseCoreType;
  isDirty: boolean;
  isManualSaving: boolean;
  getValues: UseFormGetValues<CourseFormData>;
  reset: UseFormReset<CourseFormData>;
  watch: UseFormWatch<CourseFormData>;
  labels: {
    autosaving: string;
    autosaved: string;
    autosaveFailed: string;
  };
};

export function useCourseAutosave({
  enabled,
  courseId,
  courseCoreType,
  isDirty,
  isManualSaving,
  getValues,
  reset,
  watch,
  labels,
}: UseCourseAutosaveOptions) {
  const [updateCourse] = useUpdateCourseMutation();
  const [status, setStatus] = useState<CourseAutosaveStatus>("idle");
  const inFlightRef = useRef(false);
  const failureCountRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(isDirty);
  const isManualSavingRef = useRef(isManualSaving);
  const enabledRef = useRef(enabled);
  const courseIdRef = useRef(courseId);
  const courseCoreTypeRef = useRef(courseCoreType);

  isDirtyRef.current = isDirty;
  isManualSavingRef.current = isManualSaving;
  enabledRef.current = enabled;
  courseIdRef.current = courseId;
  courseCoreTypeRef.current = courseCoreType;

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const performAutosave = useCallback(async () => {
    const id = courseIdRef.current;
    if (
      !enabledRef.current ||
      !id ||
      !isDirtyRef.current ||
      isManualSavingRef.current ||
      inFlightRef.current
    ) {
      return;
    }

    inFlightRef.current = true;
    clearDebounce();
    setStatus("saving");

    try {
      const payload = removeEmptyStrings({
        ...getValues(),
        course_core_type: courseCoreTypeRef.current,
      }) as CourseFormData;

      const result = await updateCourse({
        id: Number(id),
        data: payload,
        silent: true,
      }).unwrap();

      if (result.status) {
        // Re-baseline defaults to current values so isDirty clears and we don't loop
        reset(getValues());
        failureCountRef.current = 0;
        setStatus("saved");
        if (savedClearTimerRef.current) {
          clearTimeout(savedClearTimerRef.current);
        }
        savedClearTimerRef.current = setTimeout(() => {
          setStatus((prev) => (prev === "saved" ? "idle" : prev));
        }, 3000);
      }
    } catch {
      failureCountRef.current += 1;
      setStatus("error");
      if (failureCountRef.current >= FAILURE_TOAST_THRESHOLD) {
        toast.error(labels.autosaveFailed);
        failureCountRef.current = 0;
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [clearDebounce, getValues, labels.autosaveFailed, reset, updateCourse]);

  const scheduleDebouncedAutosave = useCallback(() => {
    if (!enabledRef.current || !courseIdRef.current || !isDirtyRef.current) {
      return;
    }
    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      void performAutosave();
    }, DEBOUNCE_MS);
  }, [clearDebounce, performAutosave]);

  // Debounce after form values change while dirty
  useEffect(() => {
    if (!enabled || !courseId) {
      clearDebounce();
      return;
    }

    const subscription = watch(() => {
      if (!isDirtyRef.current) return;
      scheduleDebouncedAutosave();
    });

    return () => {
      subscription.unsubscribe();
      clearDebounce();
    };
  }, [enabled, courseId, watch, scheduleDebouncedAutosave, clearDebounce]);

  // Safety interval while dirty
  useEffect(() => {
    if (!enabled || !courseId) return;

    const intervalId = setInterval(() => {
      if (isDirtyRef.current) {
        void performAutosave();
      }
    }, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [enabled, courseId, performAutosave]);

  // Save when tab is hidden
  useEffect(() => {
    if (!enabled || !courseId) return;

    const onVisibilityChange = () => {
      if (document.hidden && isDirtyRef.current) {
        void performAutosave();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, courseId, performAutosave]);

  useEffect(() => {
    return () => {
      clearDebounce();
      if (savedClearTimerRef.current) {
        clearTimeout(savedClearTimerRef.current);
      }
    };
  }, [clearDebounce]);

  const statusLabel =
    status === "saving"
      ? labels.autosaving
      : status === "saved"
        ? labels.autosaved
        : status === "error"
          ? labels.autosaveFailed
          : null;

  return { status, statusLabel, isAutosaving: status === "saving" };
}
