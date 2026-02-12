"use client";

import { useState } from "react";
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

const resourceFormSchema = z.object({
  course_id: z.string().min(1, {
    message: "Please select a course.",
  }),
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  description: z.string().optional(),
  job_type: z.enum(["On", "Off"]),
  resource_type: z.enum(["PDF", "WORD", "PPT", "Text", "Image"]),
  hours: z.number().min(0, "Hours must be 0 or greater").max(23, "Hours must be less than 24"),
  minute: z.number().min(0, "Minutes must be 0 or greater").max(59, "Minutes must be less than 60"),
  file: z
    .instanceof(File, {
      message: "Please upload a file.",
    })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size must be less than 10MB.",
    })
    .optional(),
});

// Create mode requires file, edit mode doesn't
const createResourceSchema = resourceFormSchema.extend({
  file: z
    .instanceof(File, {
      message: "Please upload a file.",
    })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size must be less than 10MB.",
    }),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;

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
  useState(() => {
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
  });

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
        toast.success("Resource updated successfully");
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
        toast.success("Resource created successfully");
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
      toast.error(errorMessage || `Failed to ${isEditMode ? "update" : "create"} resource`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Resource" : "Create New Resource"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the resource details. Click save when you're done." 
              : "Upload a new learning resource. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Select course" />
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
                          No courses available
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
                  <FormLabel>File {!isEditMode && <span className="text-destructive">*</span>}</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      {isEditMode && resource?.url?.url && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Current file: <a href={resource.url.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{resource.url?.key || "View file"}</a>
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
                    Max file size: 10MB
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter resource name" 
                      {...field}
                      readOnly
                      className="bg-muted"
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Name is automatically set from the uploaded file
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter resource description"
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
                    <FormLabel>Hours (GLH)</FormLabel>
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
                    <FormLabel>Minutes (GLH)</FormLabel>
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
                    <FormLabel>Job Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="On">On</SelectItem>
                        <SelectItem value="Off">Off</SelectItem>
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
                    <FormLabel>Resource Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Select resource type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="WORD">WORD</SelectItem>
                        <SelectItem value="PPT">PPT</SelectItem>
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="Image">Image</SelectItem>
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
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Resource"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
