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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useAddResourceMutation,
  useUpdateResourceMutation,
} from "@/store/api/health-wellbeing/healthWellbeingApi";
import type { WellbeingResource, AddResourcePayload, UpdateResourcePayload } from "@/store/api/health-wellbeing/types";
import { toast } from "sonner";

const resourceFormSchema = z.object({
  resource_name: z.string().min(1, "Resource name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  resourceType: z.enum(["FILE", "URL"]),
  isActive: z.boolean().optional(),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;

interface WellbeingResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: WellbeingResource | null;
  onSuccess: () => void;
}

export function WellbeingResourceFormDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: WellbeingResourceFormDialogProps) {
  const isEditMode = !!resource;
  const [addResource, { isLoading: isAdding }] = useAddResourceMutation();
  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    mode: "onChange",
    defaultValues: {
      resource_name: "",
      description: "",
      location: "",
      resourceType: "URL",
      isActive: true,
    },
  });

  const watchedResourceType = form.watch("resourceType");

  useEffect(() => {
    if (resource && open) {
      form.reset({
        resource_name: resource.resource_name || "",
        description: resource.description || "",
        location: resource.location || "",
        resourceType: (resource.resourceType || "URL") as "FILE" | "URL",
        isActive: resource.isActive ?? true,
      });
    } else if (!resource && open) {
      form.reset({
        resource_name: "",
        description: "",
        location: "",
        resourceType: "URL",
        isActive: true,
      });
    }
  }, [resource, open, form]);

  const onSubmit = async (data: ResourceFormValues) => {
    try {
      if (isEditMode && resource) {
        const updatePayload: UpdateResourcePayload = {
          resource_name: data.resource_name,
          description: data.description || undefined,
          location: data.location,
          resourceType: data.resourceType,
          isActive: data.isActive,
        };
        await updateResource({
          id: resource.id,
          payload: updatePayload,
        }).unwrap();
        toast.success("Resource updated successfully");
      } else {
        const addPayload: AddResourcePayload = {
          resource_name: data.resource_name,
          description: data.description || "",
          location: data.location,
          resourceType: data.resourceType,
          isActive: data.isActive ?? true,
        };
        await addResource(addPayload).unwrap();
        toast.success("Resource added successfully");
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(
        isEditMode
          ? "Failed to update resource"
          : "Failed to add resource"
      );
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Resource" : "Add Resource"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the resource information below."
              : "Fill in the details to add a new wellbeing resource."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Resource Name */}
          <div className="space-y-2">
            <Label htmlFor="resource_name">
              Resource Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resource_name"
              {...form.register("resource_name")}
              placeholder="Enter resource name"
              disabled={isLoading}
            />
            {form.formState.errors.resource_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.resource_name.message}
              </p>
            )}
          </div>

          {/* Resource Type */}
          <div className="space-y-2">
            <Label htmlFor="resourceType">
              Resource Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="resourceType">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URL">URL Link</SelectItem>
                    <SelectItem value="FILE">File Upload</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.resourceType && (
              <p className="text-sm text-destructive">
                {form.formState.errors.resourceType.message}
              </p>
            )}
          </div>

          {/* Location (URL or File) */}
          <div className="space-y-2">
            <Label htmlFor="location">
              {watchedResourceType === "URL" ? "Resource URL" : "File Location"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            {watchedResourceType === "URL" ? (
              <Input
                id="location"
                type="url"
                {...form.register("location")}
                placeholder="https://example.com/resource"
                disabled={isLoading}
              />
            ) : (
              <Input
                id="location"
                {...form.register("location")}
                placeholder="File path or URL"
                disabled={isLoading}
              />
            )}
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter resource description"
              rows={4}
              disabled={isLoading}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Resource" : "Add Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

