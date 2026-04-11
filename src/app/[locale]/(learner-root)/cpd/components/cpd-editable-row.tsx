"use client";

import { useState, useEffect } from "react";
import { Save, Trash2, Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfDay, isAfter } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TableCell, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useCreateCpdEntryMutation,
  useUpdateCpdEntryMutation,
  useDeleteCpdEntryMutation,
} from "@/store/api/cpd/cpdApi";
import { toast } from "sonner";
import type { CpdTableHeader } from "./cpd-data-table";
import { useTranslations } from "next-intl";

/** Parse API or form date strings without throwing; supports `yyyy-MM-dd` and ISO datetimes. */
function parseCpdFormDate(val: string): Date | undefined {
  const trimmed = val?.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T12:00:00`);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function normalizeDateForCpdForm(val: string): string {
  const d = parseCpdFormDate(val);
  return d ? format(d, "yyyy-MM-dd") : "";
}

const todayYmd = () => format(new Date(), "yyyy-MM-dd");

const cpdEntrySchema = z.object({
  activity: z.string().min(1, "cpd.validation.activityRequired"),
  date: z
    .string()
    .min(1, "cpd.validation.dateRequired")
    .refine(
      (val) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(val) || val <= todayYmd(),
      { message: "cpd.validation.dateNotInFuture" },
    ),
  method: z.string().min(1, "cpd.validation.methodRequired"),
  learning: z.string().min(1, "cpd.validation.learningRequired"),
  impact: z.string().min(1, "cpd.validation.impactRequired"),
});

type CpdEntryFormValues = z.infer<typeof cpdEntrySchema>;

interface CpdEditableRowProps {
  row: Record<string, string>;
  headers: CpdTableHeader[];
  onUpdate: (rowId: string, updatedRow: Record<string, string>) => void;
  onDelete: (rowId: string) => void;
}

export function CpdEditableRow({
  row,
  headers,
  onUpdate,
  onDelete,
}: CpdEditableRowProps) {
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";
  const [isSaving, setIsSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [createEntry] = useCreateCpdEntryMutation();
  const [updateEntry] = useUpdateCpdEntryMutation();
  const [deleteEntry] = useDeleteCpdEntryMutation();
  const t = useTranslations("cpd");

  const form = useForm<CpdEntryFormValues>({
    resolver: zodResolver(cpdEntrySchema),
    defaultValues: {
      activity: row.activity || "",
      date: normalizeDateForCpdForm(row.date || ""),
      method: row.method || "",
      learning: row.learning || "",
      impact: row.impact || "",
    },
  });

  const rowId = String(row.id || "");
  const isNewRow = rowId.startsWith("temp-");
  const isDirty = form.formState.isDirty;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  useEffect(() => {
    form.reset({
      activity: row.activity || "",
      date: normalizeDateForCpdForm(row.date || ""),
      method: row.method || "",
      learning: row.learning || "",
      impact: row.impact || "",
    });
  }, [row, form]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      form.setValue("date", formattedDate, { shouldDirty: true });
    } else {
      form.setValue("date", "", { shouldDirty: true });
    }
    setDateOpen(false);
  };

  const onSubmit = async (values: CpdEntryFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        what_training: values.activity,
        date: values.date,
        how_you_did: values.method,
        what_you_learned: values.learning,
        how_it_improved_work: values.impact,
      };

      if (isNewRow) {
        const result = await createEntry(payload).unwrap();
        if (result?.data) {
          onUpdate(rowId, {
            ...row,
            ...values,
            id: String(result.data.id || ""),
            user_id: String(result.data.user_id || ""),
          });
          toast.success("CPD entry added successfully");
          form.reset(values);
        }
      } else {
        await updateEntry({ id: rowId, data: payload }).unwrap();
        onUpdate(rowId, {
          ...row,
          ...values,
        });
        toast.success(t("toast.updateSuccess"));
        form.reset(values);
      }
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { message?: string })?.message
          : t("toast.saveFailed");
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNewRow) {
      onDelete(rowId);
      return;
    }

    try {
      await deleteEntry(rowId).unwrap();
      onDelete(rowId);
      toast.success(t("toast.deleteSuccess"));
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { message?: string })?.message
          : t("toast.deleteFailed");
      toast.error(errorMessage);
    }
  };

  const dateValue = form.watch("date");
  const selectedDate = dateValue ? parseCpdFormDate(dateValue) : undefined;

  const todayStart = startOfDay(new Date());
  const isFutureCalendarDay = (d: Date) =>
    isAfter(startOfDay(d), todayStart);

  return (
    <TableRow className={cn(isSaving && "bg-primary", hasErrors && "bg-destructive")}>
      {headers.map((header) => {
        const fieldName = header.id as keyof CpdEntryFormValues;
        const error = form.formState.errors[fieldName];

        return (
          <TableCell key={header.id} className="align-top">
            {header.id === "date" ? (
              <div className="space-y-1">
                <Controller
                  name="date"
                  control={form.control}
                  render={({ field }) => (
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            error && "border-destructive"
                          )}
                          disabled={isSaving || isEmployer}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {(() => {
                            const d = field.value?.trim()
                              ? parseCpdFormDate(field.value)
                              : undefined;
                            if (d) return format(d, "PPP");
                            if (field.value?.trim())
                              return (
                                <span className="text-muted-foreground">
                                  {field.value}
                                </span>
                              );
                            return <span>{t("placeholders.pickDate")}</span>;
                          })()}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateChange}
                          disabled={isFutureCalendarDay}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {error && (
                  <p className="text-destructive text-xs">
                    {t(error.message as string)}
                  </p>
                )}
              </div>
            ) : header.multiline ? (
              <div className="space-y-1">
                <Textarea
                  {...form.register(fieldName)}
                  placeholder={t("placeholders.field", {
                    field: header.label.toLowerCase(),
                  })}
                  disabled={isSaving || isEmployer}
                  className={cn(
                    "min-h-[80px] resize-none",
                    error && "border-destructive"
                  )}
                />
                {error && (
                  <p className="text-destructive text-xs">
                    {t(error.message as string)}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Input
                  {...form.register(fieldName)}
                  placeholder={t("placeholders.field", {
                    field: header.label.toLowerCase(),
                  })}
                  disabled={isSaving || isEmployer}
                  className={error ? "border-destructive" : ""}
                />
                {error && (
                  <p className="text-destructive text-xs">
                    {t(error.message as string)}
                  </p>
                )}
              </div>
            )}
          </TableCell>
        );
      })}
      <TableCell className="align-top">
        {!isEmployer && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={form.handleSubmit(onSubmit)}
              disabled={!isDirty || isSaving || hasErrors}
              className="h-8 w-8 p-0"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isSaving}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

