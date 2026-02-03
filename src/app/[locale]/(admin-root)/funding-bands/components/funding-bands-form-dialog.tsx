"use client";

import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateFundingBandMutation,
  useUpdateFundingBandMutation,
} from "@/store/api/funding-band/fundingBandApi";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import type { FundingBand } from "@/store/api/funding-band/types";
import { toast } from "sonner";

const createFundingBandSchema = z.object({
  course_id: z.string().min(1, "Course is required"),
  band_name: z.string().min(1, "Band name is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Amount must be a positive number" }
    ),
});

const updateFundingBandSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Amount must be a positive number" }
    ),
});

type CreateFundingBandFormValues = z.infer<typeof createFundingBandSchema>;
type UpdateFundingBandFormValues = z.infer<typeof updateFundingBandSchema>;

interface FundingBandsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundingBand: FundingBand | null;
  onSuccess: () => void;
}

export function FundingBandsFormDialog({
  open,
  onOpenChange,
  fundingBand,
  onSuccess,
}: FundingBandsFormDialogProps) {
  const isEditMode = !!fundingBand;

  const [createFundingBand, { isLoading: isCreating }] =
    useCreateFundingBandMutation();
  const [updateFundingBand, { isLoading: isUpdating }] =
    useUpdateFundingBandMutation();

  // Fetch courses for dropdown
  const { data: coursesData, isLoading: isLoadingCourses } = useCachedCoursesList({
    skip: !open
  });

  const form = useForm<CreateFundingBandFormValues | UpdateFundingBandFormValues>({
    resolver: zodResolver(isEditMode ? updateFundingBandSchema : createFundingBandSchema),
    defaultValues: isEditMode
      ? {
          amount: "",
        }
      : {
          course_id: "",
          band_name: "",
          amount: "",
        },
  });

  useEffect(() => {
    if (fundingBand && open) {
      form.reset({
        amount: fundingBand.amount.toString(),
      });
    } else if (!fundingBand && open) {
      form.reset({
        course_id: "",
        band_name: "",
        amount: "",
      });
    }
  }, [fundingBand, open, form]);

  const onSubmit = async (
    values: CreateFundingBandFormValues | UpdateFundingBandFormValues
  ) => {
    try {
      if (isEditMode) {
        const updateData = values as UpdateFundingBandFormValues;
        await updateFundingBand({
          id: fundingBand.id,
          data: {
            amount: parseFloat(updateData.amount),
          },
        }).unwrap();
        toast.success("Funding band updated successfully");
      } else {
        const createData = values as CreateFundingBandFormValues;
        const selectedCourse = coursesData?.data?.find(
          (c) => c.course_id.toString() === createData.course_id
        );
        
        if (!selectedCourse) {
          toast.error("Please select a valid course");
          return;
        }
        
        await createFundingBand({
          course_id: parseInt(createData.course_id),
          band_name: selectedCourse.course_name,
          amount: parseFloat(createData.amount),
        }).unwrap();
        toast.success("Funding band created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(
        errorMessage ||
          `Failed to ${isEditMode ? "update" : "create"} funding band`
      );
    }
  };

  const isLoading = isCreating || isUpdating;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Funding Band" : "Create New Funding Band"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update funding band amount below."
              : "Fill in the form below to create a new funding band."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Course Selection (only for create mode) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="course_id">
                Select Course <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="course_id"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selectedCourse = coursesData?.data?.find(
                          (c) => c.course_id.toString() === value
                        );
                        if (selectedCourse) {
                          form.setValue("band_name", selectedCourse.course_name);
                        }
                      }}
                      disabled={isLoadingCourses}
                    >
                      <SelectTrigger
                        id="course_id"
                        className={
                          !isEditMode &&
                          "course_id" in form.formState.errors &&
                          form.formState.errors.course_id
                            ? "border-destructive"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCourses ? (
                          <SelectItem value="loading" disabled>
                            Loading courses...
                          </SelectItem>
                        ) : (
                          coursesData?.data?.map((course) => (
                            <SelectItem
                              key={course.course_id}
                              value={course.course_id.toString()}
                            >
                              {course.course_name}
                              {course.course_code && ` (Code: ${course.course_code})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {!isEditMode &&
                      "course_id" in form.formState.errors &&
                      form.formState.errors.course_id && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.course_id.message}
                        </p>
                      )}
                  </>
                )}
              />
            </div>
          )}

          {/* Band Name (only for create mode, auto-filled) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="band_name">
                Band Name <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="band_name"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Input
                      id="band_name"
                      placeholder="Band name (auto-filled from course)"
                      {...field}
                      readOnly
                      className={
                        !isEditMode &&
                        "band_name" in form.formState.errors &&
                        form.formState.errors.band_name
                          ? "border-destructive"
                          : "bg-muted"
                      }
                    />
                    {!isEditMode &&
                      "band_name" in form.formState.errors &&
                      form.formState.errors.band_name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.band_name.message}
                        </p>
                      )}
                  </>
                )}
              />
            </div>
          )}

          {/* Course Info (read-only in edit mode) */}
          {isEditMode && (
            <div className="space-y-2">
              <Label>Course</Label>
              <Input
                value={fundingBand.course.course_name}
                readOnly
                className="bg-muted"
              />
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (£) <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => (
                <>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount"
                      {...field}
                      className={`pl-8 ${
                        form.formState.errors.amount ? "border-destructive" : ""
                      }`}
                    />
                  </div>
                  {form.formState.errors.amount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.amount.message}
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

