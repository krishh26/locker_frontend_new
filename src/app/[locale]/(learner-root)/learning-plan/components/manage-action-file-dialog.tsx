"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUploadActionFileMutation } from "@/store/api/learner-plan/learnerPlanApi";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";

const fileSchema = z.object({
  file: z
    .instanceof(File, { message: "A file is required" })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size must be less than 10MB",
    })
    .refine(
      (file) => {
        const extension = file.name.split(".").pop()?.toUpperCase();
        const allowedTypes = [
          "JPG",
          "JPEG",
          "PNG",
          "GIF",
          "PDF",
          "DOCX",
          "XLSX",
          "PPTX",
          "TXT",
          "ZIP",
          "MP4",
        ];
        return extension && allowedTypes.includes(extension);
      },
      {
        message: "Unsupported file format",
      }
    ),
});

type FileFormData = z.infer<typeof fileSchema>;

interface ManageActionFileDialogProps {
  open: boolean;
  onClose: () => void;
  actionId: number;
  onSuccess?: () => void;
}

export function ManageActionFileDialog({
  open,
  onClose,
  actionId,
  onSuccess,
}: ManageActionFileDialogProps) {
  const [uploadActionFile, { isLoading }] = useUploadActionFileMutation();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FileFormData>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      file: undefined,
    },
  });

  const selectedFile = watch("file") as File | undefined;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, onChange: (file: File) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onChange(file);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onChange(file);
    }
  };

  const onSubmit = async (data: FileFormData) => {
    try {
      const formData = new FormData();
      formData.append("file", data.file);

      await uploadActionFile({
        id: actionId,
        data: formData,
      }).unwrap();

      toast.success("File uploaded successfully");
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Actions Files</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 mt-4">
            <Controller
              name="file"
              control={control}
              render={({ field: { onChange, value } }) => (
                <div>
                  <Label className="mb-2">File Upload</Label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={(e) => handleDrop(e, onChange)}
                    className={`relative border-2 border-dashed rounded-lg p-12 cursor-pointer transition-all ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    } ${
                      errors.file
                        ? "border-destructive"
                        : ""
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, onChange)}
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.xlsx,.pptx,.txt,.zip,.mp4"
                    />
                    {value ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center space-x-2">
                          <Upload className="h-8 w-8 text-primary" />
                          <p className="font-medium text-sm">{value.name}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange(undefined as unknown as File);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(value.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Drag and drop your files here or{" "}
                            <span className="text-primary underline">Browse</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max 10MB files are allowed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.file && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.file.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile}>
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

