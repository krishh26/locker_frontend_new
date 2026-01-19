"use client";

import { useState, useEffect } from "react";
import { Save, Trash2, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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

const cpdEntrySchema = z.object({
  activity: z.string().min(1, "Activity is required"),
  date: z.string().min(1, "Date is required"),
  method: z.string().min(1, "Method is required"),
  learning: z.string().min(1, "Learning is required"),
  impact: z.string().min(1, "Impact is required"),
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
  const [isSaving, setIsSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [createEntry] = useCreateCpdEntryMutation();
  const [updateEntry] = useUpdateCpdEntryMutation();
  const [deleteEntry] = useDeleteCpdEntryMutation();

  const form = useForm<CpdEntryFormValues>({
    resolver: zodResolver(cpdEntrySchema),
    defaultValues: {
      activity: row.activity || "",
      date: row.date || "",
      method: row.method || "",
      learning: row.learning || "",
      impact: row.impact || "",
    },
    mode: "onChange",
  });

  const rowId = String(row.id || "");
  const isNewRow = rowId.startsWith("temp-");
  const isDirty = form.formState.isDirty;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  useEffect(() => {
    form.reset({
      activity: row.activity || "",
      date: row.date || "",
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
        toast.success("CPD entry updated successfully");
        form.reset(values);
      }
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { message?: string })?.message
          : "Failed to save CPD entry";
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
      toast.success("CPD entry deleted successfully");
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { message?: string })?.message
          : "Failed to delete CPD entry";
      toast.error(errorMessage);
    }
  };

  const dateValue = form.watch("date");
  const selectedDate = dateValue
    ? (() => {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? undefined : date;
      })()
    : undefined;

  return (
    <TableRow className={cn(isSaving && "bg-primary/5", hasErrors && "bg-destructive/5")}>
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
                          disabled={isSaving}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date *</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {error && (
                  <p className="text-destructive text-xs">{error.message}</p>
                )}
              </div>
            ) : header.multiline ? (
              <div className="space-y-1">
                <Textarea
                  {...form.register(fieldName)}
                  placeholder={`Enter ${header.label.toLowerCase()} *`}
                  disabled={isSaving}
                  className={cn(
                    "min-h-[80px] resize-none",
                    error && "border-destructive"
                  )}
                />
                {error && (
                  <p className="text-destructive text-xs">{error.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Input
                  {...form.register(fieldName)}
                  placeholder={`Enter ${header.label.toLowerCase()} *`}
                  disabled={isSaving}
                  className={error ? "border-destructive" : ""}
                />
                {error && (
                  <p className="text-destructive text-xs">{error.message}</p>
                )}
              </div>
            )}
          </TableCell>
        );
      })}
      <TableCell className="align-top">
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
      </TableCell>
    </TableRow>
  );
}

