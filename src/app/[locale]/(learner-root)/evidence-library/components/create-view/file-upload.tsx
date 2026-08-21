"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Controller, Control, FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { EvidenceFormValues } from "./evidence-form-types";

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".mp4",
  ".mp3",
];

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
  const t = useTranslations("evidenceLibrary");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const isAcceptedFile = useCallback((file: File) => {
    const lower = file.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }, []);

  const handleFileChange = useCallback(
    (file: File | null, onChange: (file: File | null) => void) => {
      if (file) {
        if (!isAcceptedFile(file)) {
          toast.error("Unsupported file type. Use PDF, DOC, DOCX, JPG, PNG, MP4, or MP3.");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(t("fileUpload.fileSizeError"));
          return;
        }
        onChange(file);
      } else {
        onChange(null);
      }
    },
    [isAcceptedFile, t]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (
      e: React.DragEvent,
      onChange: (file: File | null) => void
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0] ?? null;
      if (file) {
        handleFileChange(file, onChange);
      }
    },
    [disabled, handleFileChange]
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, field.onChange)}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 transition-colors",
              error
                ? "border-destructive bg-destructive/5"
                : dragActive
                  ? "border-primary bg-primary/5"
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
                    onClick={() => {
                      field.onChange(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex w-full flex-col items-center justify-center cursor-pointer bg-transparent border-0 p-0",
                  disabled && "cursor-not-allowed"
                )}
              >
                <input
                  ref={fileInputRef}
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
              </button>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive">{t(String(error.message))}</p>
          )}
        </div>
      )}
    />
  );
}
