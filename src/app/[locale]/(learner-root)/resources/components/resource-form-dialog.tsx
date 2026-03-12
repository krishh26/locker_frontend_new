"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateResourceMutation, useUpdateResourceMutation } from "@/store/api/resources/resourcesApi";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Resource } from "@/store/api/resources/types";
import { useTranslations } from "next-intl";

type ResourceFormValues = {
  course_id: string;
  name: string;
  description?: string;
  job_type: "On" | "Off";
  resource_type: "PDF" | "WORD" | "PPT" | "Text" | "Image";
  hours: number;
  minute: number;
  file?: File;
};

interface ResourceFormDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  resource?: Resource | null;
  mode?: "create" | "edit";
}

export function ResourceFormDialog({ 
  onSuccess, 
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  resource,
  mode = "create",
}: ResourceFormDialogProps) {
  const t = useTranslations("resources");
  const isEditMode = mode === "edit" && !!resource;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [createResource, { isLoading: isCreating }] = useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();
  const isLoading = isCreating || isUpdating;
  
  // Fetch courses for dropdown
  const { data: coursesResponse, isLoading: isLoadingCourses } = useCachedCoursesList();
  
  const courses = coursesResponse?.data || [];

  const resourceFormSchema = useMemo(
    () =>
      z.object({
        course_id: z.string().min(1, {
          message: t("form.validation.selectCourse"),
        }),
        name: z.string().min(1, {
          message: t("form.validation.nameRequired"),
        }),
        description: z.string().optional(),
        job_type: z.enum(["On", "Off"]),
        resource_type: z.enum(["PDF", "WORD", "PPT", "Text", "Image"]),
        hours: z
          .number()
          .min(0, t("form.validation.hoursMin"))
          .max(23, t("form.validation.hoursMax")),
        minute: z
          .number()
          .min(0, t("form.validation.minutesMin"))
          .max(59, t("form.validation.minutesMax")),
        file: z
          .instanceof(File, {
            message: t("form.validation.uploadFile"),
          })
          .refine((file) => file.size <= 10 * 1024 * 1024, {
            message: t("form.validation.fileTooLarge"),
          })
          .optional(),
      }),
    [t]
  );

  const createResourceSchema = useMemo(
    () =>
      resourceFormSchema.extend({
        file: z
          .instanceof(File, {
            message: t("form.validation.uploadFile"),
          })
          .refine((file) => file.size <= 10 * 1024 * 1024, {
            message: t("form.validation.fileTooLarge"),
          }),
      }),
    [resourceFormSchema, t]
  );

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(isEditMode ? resourceFormSchema : createResourceSchema),
    defaultValues: {
      course_id: (resource?.course_id ? String(resource.course_id) : "") as string,
      name: resource?.name ?? "",
      description: resource?.description ?? "",
      job_type: (resource?.job_type as "On" | "Off") ?? "On",
      resource_type: (resource?.resource_type as "PDF" | "WORD" | "PPT" | "Text" | "Image") ?? "PDF",
      hours: Number(resource?.hours ?? 0),
      minute: Number(resource?.minute ?? 0),
    },
  });

  // Reset form when resource changes or dialog opens
  useEffect(() => {
    if (open && isEditMode && resource) {
      form.reset({
        course_id: String(resource.course_id ?? ""),
        name: resource.name ?? "",
        description: resource.description ?? "",
        job_type: (resource.job_type as "On" | "Off") ?? "On",
        resource_type: (resource.resource_type as "PDF" | "WORD" | "PPT" | "Text" | "Image") ?? "PDF",
        hours: Number(resource.hours ?? 0),
        minute: Number(resource.minute ?? 0),
      });
    }
  }, [form, isEditMode, open, resource]);

  const fileRef = form.register("file");

  async function onSubmit(data: ResourceFormValues) {
    try {
      if (isEditMode && resource) {
        // Update existing resource
        const updateData: Record<string, unknown> = {
          course_id: data.course_id,
          name: data.name,
          description: data.description || "",
          job_type: data.job_type,
          resource_type: data.resource_type,
          hours: String(data.hours ?? 0),
          minute: String(data.minute ?? 0),
        };
        
        // If a new file is provided, use FormData
        if (data.file) {
          const formData = new FormData();
          Object.entries(updateData).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
          formData.append("file", data.file);
          await updateResource({ 
            id: String(resource.resource_id || resource.id), 
            data: formData as unknown as Record<string, unknown> 
          }).unwrap();
        } else {
          await updateResource({ 
            id: String(resource.resource_id || resource.id), 
            data: updateData 
          }).unwrap();
        }
        toast.success(t("form.toast.updated"));
      } else {
        // Create new resource
        const formData = new FormData();
        formData.append("course_id", data.course_id);
        formData.append("name", data.name || data.file!.name);
        if (data.description) {
          formData.append("description", data.description);
        }
        formData.append("job_type", data.job_type);
        formData.append("resource_type", data.resource_type);
        formData.append("hours", String(data.hours ?? 0));
        formData.append("minute", String(data.minute ?? 0));
        formData.append("file", data.file!);

        await createResource(formData as FormData).unwrap();
        toast.success(t("form.toast.created"));
      }
      
      form.reset({
        course_id: "",
        name: "",
        description: "",
        job_type: "On",
        resource_type: "PDF",
        hours: 0,
        minute: 0,
      });
      setOpen(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(
        errorMessage ||
          (isEditMode ? t("form.toast.updateFailed") : t("form.toast.createFailed"))
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("form.title.edit") : t("form.title.create")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? t("form.description.edit")
              : t("form.description.create")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.fields.course")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder={t("form.placeholders.selectCourse")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCourses ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : courses.length > 0 ? (
                        courses.map((course) => (
                          <SelectItem
                            key={course.course_id}
                            value={course.course_id.toString()}
                          >
                            {course.course_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          {t("form.placeholders.noCourses")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.fields.file")}{" "}
                    {!isEditMode && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      {isEditMode && resource?.url?.url && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {t("form.helper.currentFilePrefix")}{" "}
                          <a
                            href={resource.url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {resource.url?.key || t("form.helper.viewFile")}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          {...fileRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                              form.setValue("name", file.name);
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {t("form.helper.maxFileSize")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.name")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t("common.dash")}
                      {...field}
                      readOnly
                      className="bg-muted"
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {t("form.helper.nameAuto")}
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.fields.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.placeholders.description")}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.hours")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.minutes")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.jobType")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder={t("form.placeholders.jobType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="On">{t("options.jobType.on")}</SelectItem>
                        <SelectItem value="Off">{t("options.jobType.off")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resource_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fields.resourceType")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder={t("form.placeholders.resourceType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PDF">{t("options.resourceType.pdf")}</SelectItem>
                        <SelectItem value="WORD">{t("options.resourceType.word")}</SelectItem>
                        <SelectItem value="PPT">{t("options.resourceType.ppt")}</SelectItem>
                        <SelectItem value="Text">{t("options.resourceType.text")}</SelectItem>
                        <SelectItem value="Image">{t("options.resourceType.image")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                {t("form.buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("form.buttons.saving") : t("form.buttons.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
