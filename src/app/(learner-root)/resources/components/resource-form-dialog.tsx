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
import { Plus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateResourceMutation } from "@/store/api/resources/resourcesApi";
import { toast } from "sonner";

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
    }),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;

interface ResourceFormDialogProps {
  onSuccess?: () => void;
}

export function ResourceFormDialog({ onSuccess }: ResourceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [createResource, { isLoading }] = useCreateResourceMutation();

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      course_id: "",
      name: "",
      description: "",
      job_type: "On",
      resource_type: "PDF",
      hours: 0,
      minute: 0,
    },
  });

  const fileRef = form.register("file");

  async function onSubmit(data: ResourceFormValues) {
    try {
      const formData = new FormData();
      formData.append("course_id", data.course_id);
      formData.append("name", data.name);
      if (data.description) {
        formData.append("description", data.description);
      }
      formData.append("job_type", data.job_type);
      formData.append("resource_type", data.resource_type);
      formData.append("hours", String(data.hours ?? 0));
      formData.append("minute", String(data.minute ?? 0));
      formData.append("file", data.file);

      await createResource(formData as FormData).unwrap();
      toast.success("Resource created successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(errorMessage || "Failed to create resource");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Create Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Resource</DialogTitle>
          <DialogDescription>
            Upload a new learning resource. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* TODO: Fetch courses from API and populate this */}
                      <SelectItem value="1">Course 1</SelectItem>
                      <SelectItem value="2">Course 2</SelectItem>
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
                  <FormLabel>File</FormLabel>
                  <FormControl>
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
                    <Input placeholder="Enter resource name" {...field} />
                  </FormControl>
                  <FormMessage />
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
                      defaultValue={field.value}
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
                      defaultValue={field.value}
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
