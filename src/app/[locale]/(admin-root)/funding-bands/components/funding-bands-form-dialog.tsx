"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
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
import { cn } from "@/lib/utils";

function getCreateFundingBandSchema(t: (key: string) => string) {
  return z.object({
    course_id: z.string().min(1, t("form.validation.courseRequired")),
    band_name: z.string().min(1, t("form.validation.bandNameRequired")),
    amount: z
      .string()
      .min(1, t("form.validation.amountRequired"))
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0;
        },
        { message: t("form.validation.amountPositive") }
      ),
  });
}

function getUpdateFundingBandSchema(t: (key: string) => string) {
  return z.object({
    amount: z
      .string()
      .min(1, t("form.validation.amountRequired"))
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0;
        },
        { message: t("form.validation.amountPositive") }
      ),
  });
}

type CreateFundingBandFormValues = z.infer<ReturnType<typeof getCreateFundingBandSchema>>;
type UpdateFundingBandFormValues = z.infer<ReturnType<typeof getUpdateFundingBandSchema>>;

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
  const t = useTranslations("fundingBands");
  const isEditMode = !!fundingBand;

  const createSchema = useMemo(() => getCreateFundingBandSchema(t), [t]);
  const updateSchema = useMemo(() => getUpdateFundingBandSchema(t), [t]);

  const [createFundingBand, { isLoading: isCreating }] =
    useCreateFundingBandMutation();
  const [updateFundingBand, { isLoading: isUpdating }] =
    useUpdateFundingBandMutation();

  // Fetch courses for dropdown
  const { data: coursesData, isLoading: isLoadingCourses } = useCachedCoursesList({
    skip: !open
  });

  const form = useForm<CreateFundingBandFormValues | UpdateFundingBandFormValues>({
    resolver: zodResolver(isEditMode ? updateSchema : createSchema),
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
        toast.success(t("form.toast.updateSuccess"));
      } else {
        const createData = values as CreateFundingBandFormValues;
        const selectedCourse = coursesData?.data?.find(
          (c) => c.course_id.toString() === createData.course_id
        );
        
        if (!selectedCourse) {
          toast.error(t("form.toast.selectValidCourse"));
          return;
        }
        
        await createFundingBand({
          course_id: parseInt(createData.course_id),
          band_name: selectedCourse.course_name,
          amount: parseFloat(createData.amount),
        }).unwrap();
        toast.success(t("form.toast.createSuccess"));
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
          (isEditMode ? t("form.toast.updateFailed") : t("form.toast.createFailed"))
      );
    }
  };

  const isLoading = isCreating || isUpdating;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("form.titleEdit") : t("form.titleCreate")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("form.descriptionEdit")
              : t("form.descriptionCreate")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Course Selection (only for create mode) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="course_id">
                {t("form.selectCourse")} <span className="text-destructive">*</span>
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
                        className={cn(
                          // Override global SelectTrigger: fixed height + nowrap + line-clamp hide long course titles
                          "w-full min-w-0 h-auto min-h-9 whitespace-normal text-left items-start gap-2 py-2",
                          "data-[size=default]:h-auto data-[size=sm]:h-auto",
                          "**:data-[slot=select-value]:block! **:data-[slot=select-value]:line-clamp-none **:data-[slot=select-value]:whitespace-normal **:data-[slot=select-value]:wrap-break-word **:data-[slot=select-value]:text-left **:data-[slot=select-value]:min-w-0 **:data-[slot=select-value]:flex-1",
                          !isEditMode &&
                            "course_id" in form.formState.errors &&
                            form.formState.errors.course_id &&
                            "border-destructive"
                        )}
                      >
                        <SelectValue placeholder={t("form.selectCoursePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        align="start"
                        collisionPadding={16}
                        className={cn(
                          // Keep panel within viewport on mobile; match trigger width; allow wrapped labels
                          "max-w-[min(calc(100vw-2rem),var(--radix-select-trigger-width))] w-(--radix-select-trigger-width) min-w-0",
                          "**:data-radix-select-viewport:min-w-0 **:data-radix-select-viewport:max-w-full"
                        )}
                      >
                        {isLoadingCourses ? (
                          <SelectItem value="loading" disabled>
                            {t("form.loadingCourses")}
                          </SelectItem>
                        ) : (
                          coursesData?.data?.map((course) => (
                            <SelectItem
                              key={course.course_id}
                              value={course.course_id.toString()}
                              className="h-auto min-h-8 min-w-0 items-start whitespace-normal wrap-break-word py-2 pr-8"
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
                {t("form.bandName")} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="band_name"
                control={form.control}
                render={({ field }) => (
                  <>
                    <input type="hidden" {...field} />
                    <div
                      id="band_name"
                      aria-readonly
                      className={cn(
                        "bg-muted text-foreground rounded-md border px-3 py-2 text-sm whitespace-normal break-words min-w-0 w-full",
                        !isEditMode &&
                          "band_name" in form.formState.errors &&
                          form.formState.errors.band_name &&
                          "border-destructive"
                      )}
                    >
                      {field.value || (
                        <span className="text-muted-foreground">
                          {t("form.bandNamePlaceholder")}
                        </span>
                      )}
                    </div>
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
              <Label>{t("form.course")}</Label>
              <div className="bg-muted text-foreground rounded-md border px-3 py-2 text-sm break-words min-w-0 w-full">
                {fundingBand.course.course_name}
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {t("form.amount")} <span className="text-destructive">*</span>
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
                      placeholder={t("form.amountPlaceholder")}
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
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || hasErrors}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? t("form.update") : t("form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

