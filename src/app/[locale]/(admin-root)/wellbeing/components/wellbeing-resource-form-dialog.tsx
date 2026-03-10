"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { WellbeingResource } from "@/store/api/health-wellbeing/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALLOWED_FILE_TYPES = [
  "JPG", "PNG", "GIF", "PDF", "DOCX", "XLSX", "PPTX", "TXT", "ZIP", "MP4", "MP3", "AVI", "MOV",
];

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip", "application/x-zip-compressed",
  "video/mp4", "audio/mpeg", "video/x-msvideo", "video/quicktime",
];

const MAX_FILE_SIZE_MB = 10;

const getResourceFormSchema = (
  t: (key: string, values?: Record<string, string | number | Date>) => string
) =>
  z.object({
    resource_name: z.string().min(1, t("form.validation.resourceNameRequired")),
    description: z.string().optional(),
    location: z.string().optional(),
    resourceType: z.enum(["FILE", "URL"]),
    isActive: z.boolean().optional(),
  });

type ResourceFormValues = {
  resource_name: string;
  description?: string;
  location?: string;
  resourceType: "FILE" | "URL";
  isActive?: boolean;
};

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
  const t = useTranslations("wellbeing");
  const commonT = useTranslations("common");
  const isEditMode = !!resource;
  const [addResource, { isLoading: isAdding }] = useAddResourceMutation();
  const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(getResourceFormSchema(t)),
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
      setUploadedFile(null);
      setFileError("");
    } else if (!resource && open) {
      form.reset({
        resource_name: "",
        description: "",
        location: "",
        resourceType: "URL",
        isActive: true,
      });
      setUploadedFile(null);
      setFileError("");
    }
  }, [resource, open, form]);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return t("form.validation.fileSizeExceeds", { max: MAX_FILE_SIZE_MB });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return t("form.validation.unsupportedFileType", {
        allowed: ALLOWED_FILE_TYPES.join(", "),
      });
    }
    return null;
  }, [t]);

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      return;
    }
    setUploadedFile(file);
    setFileError("");
  }, [validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setFileError("");
  }, []);

  const onSubmit = async (data: ResourceFormValues) => {
    try {
      const formData = new FormData();
      formData.append("resourceType", data.resourceType);
      formData.append("description", data.description || "");

      if (data.resourceType === "FILE") {
        if (!uploadedFile && !isEditMode) {
          setFileError(t("form.validation.pleaseUploadFile"));
          return;
        }
        if (uploadedFile) {
          formData.append("file", uploadedFile);
        }
      } else {
        if (!data.location) {
          form.setError("location", { message: t("form.validation.urlRequired") });
          return;
        }
        formData.append("url", data.location);
        formData.append("resource_name", data.resource_name);
      }

      if (isEditMode) {
        formData.append("isActive", String(data.isActive ?? true));
      }

      if (isEditMode && resource) {
        await updateResource({ id: resource.id, payload: formData }).unwrap();
        toast.success(t("toast.updatedSuccess"));
      } else {
        await addResource(formData).unwrap();
        toast.success(t("toast.addedSuccess"));
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(isEditMode ? t("toast.updateFailed") : t("toast.addFailed"));
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("form.titleEdit") : t("form.titleAdd")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("form.descriptionEdit")
              : t("form.descriptionAdd")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Resource Name */}
          <div className="space-y-2">
            <Label htmlFor="resource_name">
              {t("form.resourceName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resource_name"
              {...form.register("resource_name")}
              placeholder={t("form.placeholders.resourceName")}
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
              {t("form.resourceType")} <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    setUploadedFile(null);
                    setFileError("");
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id="resourceType">
                    <SelectValue placeholder={t("form.placeholders.resourceType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URL">{t("form.resourceTypeOptions.url")}</SelectItem>
                    <SelectItem value="FILE">{t("form.resourceTypeOptions.file")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* File Upload or URL Input */}
          {watchedResourceType === "FILE" ? (
            <div className="space-y-2">
              <Label>
                {t("form.uploadFile")} <span className="text-destructive">*</span>
              </Label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_MIME_TYPES.join(",")}
                onChange={handleFileInputChange}
                disabled={isLoading}
              />

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all hover:border-primary/50 hover:bg-muted/50",
                  isDragOver && "border-primary bg-primary",
                  fileError && "border-destructive bg-destructive",
                  !isDragOver && !fileError && "border-border"
                )}
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="size-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-2 size-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : isEditMode && resource ? (
                  <div>
                    <FileText className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("form.currentFile")}{" "}
                      <span className="font-medium">{resource.resource_name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("form.uploadNewToReplace")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-foreground">
                      {t("form.dragDrop")}{" "}
                      <span className="font-medium text-primary underline">{t("form.browse")}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("form.maxSizeAndSupported", {
                        max: MAX_FILE_SIZE_MB,
                        types: ALLOWED_FILE_TYPES.join(", "),
                      })}
                    </p>
                  </div>
                )}
              </div>

              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="location">
                {t("form.resourceUrl")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                type="url"
                {...form.register("location")}
                placeholder={t("form.placeholders.resourceUrl")}
                disabled={isLoading}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("form.description")}</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder={t("form.placeholders.description")}
              rows={4}
              disabled={isLoading}
            />
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
              {t("form.active")}
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {commonT("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? t("form.updateResource") : t("form.addResource")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
