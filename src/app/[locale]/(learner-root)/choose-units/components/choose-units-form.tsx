"use client";

import { Button } from "@/components/ui/button";
import type { Unit } from "@/store/api/units/types";
import { useGetUnitsByCourseQuery, useSaveSelectedUnitsMutation } from "@/store/api/units/unitsApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAppSelector } from "@/store/hooks";
import { ChooseUnitsDataTable } from "./choose-units-data-table";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

const formSchema = z.object({
  selectedUnitIds: z.array(z.string()),
});

export type FormValues = z.infer<typeof formSchema>;

export function ChooseUnitsForm() {
  const selectedCourseId = useAppSelector(selectCurrentCourseId);
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";
  // Get learner and course data from Redux state
  const learner = useAppSelector((state) => state.auth.learner);
  // Get learner ID
  const learnerId = learner?.learner_id ? learner.learner_id : null;

  // Fetch units from API
  const { data: unitsResponse, isLoading } = useGetUnitsByCourseQuery(selectedCourseId || 0, {
    skip: !selectedCourseId, // Skip query if no course ID
  });

  const [saveSelectedUnits, { isLoading: isSaving }] = useSaveSelectedUnitsMutation();

  const units = useMemo(() => {
    return (unitsResponse?.units || []) as Unit[];
  }, [unitsResponse?.units]);
  
  const mandatoryUnitIds = useMemo(() => {
    return units
      .filter((unit: Unit) => unit.mandatory)
      .map((unit: Unit) => String(unit.id));
  }, [units]);

  const defaultValues = useMemo(() => {
    return {
      selectedUnitIds: mandatoryUnitIds,
    };
  }, [mandatoryUnitIds]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Update form when units load
  useEffect(() => {
    if (mandatoryUnitIds.length > 0 && form.getValues("selectedUnitIds").length === 0) {
      form.reset({
        selectedUnitIds: mandatoryUnitIds,
      });
    }
  }, [mandatoryUnitIds, form]);

  // Enhanced validation function
  const validateForm = (selectedIds: string[]): string | null => {
    const selectedUnits = units.filter((unit: Unit) => selectedIds.includes(String(unit.id)));
    const optionalUnits = selectedUnits.filter((unit: Unit) => !unit.mandatory);
    const optionalCredits = optionalUnits.reduce((sum: number, unit: Unit) => sum + (unit.credit_value || 0), 0);

    // Check if mandatory units are all included
    const missingMandatory = mandatoryUnitIds.filter((id: string) => !selectedIds.includes(id));
    if (missingMandatory.length > 0) {
      return "All mandatory units must be selected";
    }

    // Check optional units credit requirement
    if (optionalUnits.length > 0 && optionalCredits < 15) {
      return "Optional units must total at least 15 credits";
    }

    return null;
  };

  const onSubmit = async (data: FormValues) => {
    const validationError = validateForm(data.selectedUnitIds);
    if (validationError) {
      form.setError("selectedUnitIds", {
        type: "manual",
        message: validationError,
      });
      return;
    }

    try {
      if (!learnerId || !selectedCourseId) {
        toast.error("Learner ID or Course ID is missing");
        return;
      }

      await saveSelectedUnits({
        learner_id: learnerId,
        course_id: selectedCourseId,
        unit_ids: data.selectedUnitIds,
      }).unwrap();

      toast.success("Units saved successfully");
    } catch (error) {
      toast.error(
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to save units"
      );
    }
  };

  const selectedUnitIds = form.watch("selectedUnitIds");
  const validationError = validateForm(selectedUnitIds);

  const selectedUnits = useMemo(() => {
    return units.filter((unit: Unit) => selectedUnitIds.includes(String(unit.id)));
  }, [units, selectedUnitIds]);

  const totals = useMemo(() => {
    return {
      units: selectedUnits.length,
      credits: selectedUnits.reduce((sum: number, unit: Unit) => sum + (unit.credit_value || 0), 0),
      glh: selectedUnits.reduce((sum: number, unit: Unit) => sum + (unit.glh || 0), 0),
    };
  }, [selectedUnits]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading units...</p>
        </div>
      </div>
    );
  }

  if (!selectedCourseId) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No course selected. Please select a qualification course.</p>
        </div>
      </div>
    );
  }

  if (!learnerId) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Learner information not available.</p>
        </div>
      </div>
    );
  }

  if (!units.length) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No units found for this course.</p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ChooseUnitsDataTable
          units={units}
          mandatoryUnitIds={mandatoryUnitIds}
        />

      {/* Sticky Summary Footer */}
      <div className="border-t bg-background px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <div className="text-sm">
                <span className="font-medium">Total Units: </span>
                <span className="text-muted-foreground">{totals.units}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Credits: </span>
                <span className="text-muted-foreground">{totals.credits}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Total GLH: </span>
                <span className="text-muted-foreground">{totals.glh}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {validationError && (
                <p className="text-sm text-destructive sm:mr-4">
                  {validationError}
                </p>
              )}
              <Button
                type="submit"
                disabled={!!validationError || isSaving || isEmployer}
                className="cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Units"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </form>
    </FormProvider>
  );
}

