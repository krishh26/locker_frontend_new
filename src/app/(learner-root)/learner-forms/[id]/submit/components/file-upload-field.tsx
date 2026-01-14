"use client";

import { useRef } from "react";
import { Controller, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";

interface FileUploadFieldProps {
  name: string;
  control: Control<Record<string, string | string[] | File | undefined>>;
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function FileUploadField({
  name,
  control,
  label,
  required,
  error,
  disabled,
}: FileUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => {
        const file = value instanceof File ? value : undefined;

        return (
          <div className="space-y-2">
            <Label>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.xlsx,.pptx,.txt,.zip,.mp4"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    // Validate file size (10MB)
                    if (selectedFile.size > 10 * 1024 * 1024) {
                      return;
                    }
                    onChange(selectedFile);
                  }
                }}
                disabled={disabled}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : "Choose File"}
              </Button>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onChange(undefined);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

