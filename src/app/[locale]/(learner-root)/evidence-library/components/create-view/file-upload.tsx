"use client";

import { useCallback } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Controller, Control, FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EvidenceFormValues } from "./evidence-form-types";

interface FileUploadProps {
  control: Control<EvidenceFormValues>;
  name: "audio" | "file";
  disabled?: boolean;
  error?: FieldError;
}

export function FileUpload({
  control,
  name,
  disabled,
  error,
}: FileUploadProps) {
  const handleFileChange = useCallback(
    (file: File | null, onChange: (file: File | null) => void) => {
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB");
          return;
        }
        onChange(file);
      } else {
        onChange(null);
      }
    },
    []
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 transition-colors",
              error
                ? "border-destructive bg-destructive/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {field.value ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{field.value.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(field.value.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => field.onChange(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <label
                className={cn(
                  "flex flex-col items-center justify-center cursor-pointer",
                  disabled && "cursor-not-allowed"
                )}
              >
                <input
                  type="file"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange(file, field.onChange);
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3"
                />
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, JPG, PNG, MP4, MP3 (Max 10MB)
                </p>
              </label>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}
        </div>
      )}
    />
  );
}

