"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import type { FormField, SimpleFormField } from "@/store/api/forms/types";

type FormFieldType = FormField | SimpleFormField;

interface FormFieldsRendererProps {
  fields: FormFieldType[];
  mode?: "preview" | "submitted";
  values?: Record<string, string | string[]>;
  files?: Record<string, string> | null;
  onChange?: (fieldId: string, value: string | string[]) => void;
  className?: string;
}

export function FormFieldsRenderer({
  fields,
  mode = "preview",
  values = {},
  files = null,
  onChange,
  className,
}: FormFieldsRendererProps) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No fields in this form.</p>
      </div>
    );
  }

  const isPreview = mode === "preview";
  const isSubmitted = mode === "submitted";

  const getFieldValue = (fieldId: string, fieldType: string): string | string[] => {
    const value = values[fieldId];
    if (!value) {
      if (fieldType === "checkbox") return [];
      return "";
    }

    if (fieldType === "checkbox") {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return [value];
        }
      }
      return [];
    }

    return typeof value === "string" ? value : "";
  };

  const getFileUrl = (fieldId: string): string | null => {
    if (!files) return null;
    return files[fieldId] || null;
  };

  const handleChange = (fieldId: string, value: string | string[]) => {
    if (onChange) {
      onChange(fieldId, value);
    }
  };

  return (
    <div className={className || "space-y-6"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const widthClass =
            field.width === "half"
              ? "md:col-span-1"
              : field.width === "third"
              ? "md:col-span-1"
              : "md:col-span-2";

          const fieldValue = isSubmitted || isPreview ? getFieldValue(field.id, field.type) : (field.type === "checkbox" ? [] : "");

          return (
            <div key={field.id} className={widthClass}>
              {(() => {
                switch (field.type) {
                  case "text":
                  case "email":
                  case "phone":
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          disabled={!isPreview}
                          type={field.type === "email" ? "email" : "text"}
                          value={isPreview || isSubmitted ? (fieldValue as string) : ""}
                          placeholder={field.placeholder}
                          onChange={(e) => isPreview && handleChange(field.id, e.target.value)}
                          className={!isPreview ? "bg-muted" : ""}
                        />
                      </div>
                    );

                  case "number":
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          disabled={!isPreview}
                          type="number"
                          value={isPreview || isSubmitted ? (fieldValue as string) : ""}
                          placeholder={field.placeholder}
                          onChange={(e) => isPreview && handleChange(field.id, e.target.value)}
                          className={!isPreview ? "bg-muted" : ""}
                        />
                      </div>
                    );

                  case "textarea":
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <Textarea
                          disabled={!isPreview}
                          value={isPreview || isSubmitted ? (fieldValue as string) : ""}
                          placeholder={field.placeholder}
                          rows={4}
                          onChange={(e) => isPreview && handleChange(field.id, e.target.value)}
                          className={!isPreview ? "bg-muted resize-none" : ""}
                        />
                      </div>
                    );

                  case "select":
                    const selectValue = isPreview || isSubmitted ? (fieldValue as string) : "";
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        {isPreview ? (
                          <Select
                            value={selectValue}
                            onValueChange={(value) => handleChange(field.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder || "Select an option"} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option, index) => (
                                <SelectItem key={index} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select disabled value={selectValue}>
                            <SelectTrigger className="bg-muted">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option, index) => (
                                <SelectItem key={index} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );

                  case "radio":
                    const radioValue = isPreview || isSubmitted ? (fieldValue as string) : "";
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        {isPreview ? (
                          <RadioGroup
                            value={radioValue}
                            onValueChange={(value) => handleChange(field.id, value)}
                          >
                            {field.options?.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={option.value}
                                  id={`${field.id}-${index}`}
                                />
                                <Label
                                  htmlFor={`${field.id}-${index}`}
                                  className="font-normal cursor-pointer"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <div className="space-y-2">
                            {field.options?.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="radio"
                                  checked={radioValue === option.value}
                                  disabled
                                  className="opacity-60"
                                />
                                <Label className="font-normal cursor-not-allowed opacity-60">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );

                  case "checkbox":
                    const checkboxValues = isPreview || isSubmitted ? (fieldValue as string[]) : [];
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <div className="space-y-2">
                          {field.options?.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              {isPreview ? (
                                <>
                                  <Checkbox
                                    id={`${field.id}-${index}`}
                                    checked={checkboxValues.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = Array.isArray(checkboxValues) ? checkboxValues : [];
                                      if (checked) {
                                        handleChange(field.id, [...currentValue, option.value]);
                                      } else {
                                        handleChange(field.id, currentValue.filter((v) => v !== option.value));
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`${field.id}-${index}`}
                                    className="font-normal cursor-pointer"
                                  >
                                    {option.label}
                                  </Label>
                                </>
                              ) : (
                                <>
                                  <Checkbox
                                    id={`${field.id}-${index}`}
                                    checked={checkboxValues.includes(option.value)}
                                    disabled
                                    className="opacity-60"
                                  />
                                  <Label
                                    htmlFor={`${field.id}-${index}`}
                                    className="font-normal cursor-not-allowed opacity-60"
                                  >
                                    {option.label}
                                  </Label>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );

                  case "date":
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          disabled={!isPreview}
                          type="date"
                          value={isPreview || isSubmitted ? (fieldValue as string) : ""}
                          onChange={(e) => isPreview && handleChange(field.id, e.target.value)}
                          className={!isPreview ? "bg-muted" : ""}
                        />
                      </div>
                    );

                  case "file":
                    if (isSubmitted) {
                      const fileUrl = getFileUrl(field.id);
                      return (
                        <div className="space-y-2">
                          <Label>
                            {field.label}
                            {field.required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </Label>
                          {fileUrl ? (
                            <div className="border rounded-lg p-4 bg-muted/30">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View uploaded file
                              </a>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/30">
                              <p className="text-sm text-muted-foreground">
                                No file uploaded
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/30">
                          <p className="text-sm text-muted-foreground mb-2">
                            {field.placeholder || "Drag and drop your files here or Browse"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Max 10MB files are allowed
                          </p>
                        </div>
                      </div>
                    );

                  case "signature":
                    if (isSubmitted) {
                      const signatureUrl = getFileUrl(field.id);
                      return (
                        <div className="space-y-2">
                          <Label>
                            {field.label}
                            {field.required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </Label>
                          {signatureUrl ? (
                            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center h-32 flex items-center justify-center bg-muted/20">
                              <Image
                                src={signatureUrl}
                                alt="Signature"
                                width={100}
                                height={100}
                                className="max-h-full max-w-full"
                              />
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center h-32 flex items-center justify-center bg-muted/20">
                              <p className="text-sm text-muted-foreground">
                                No signature provided
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center h-32 flex items-center justify-center bg-muted/20">
                          <p className="text-sm text-muted-foreground">
                            Signature pad {isPreview ? "(preview only)" : "(preview)"}
                          </p>
                        </div>
                      </div>
                    );

                  default:
                    return (
                      <div className="space-y-2">
                        <Label>{field.label}</Label>
                        <Input
                          disabled={!isPreview}
                          value={isPreview || isSubmitted ? (fieldValue as string) : ""}
                          placeholder={field.placeholder}
                          onChange={(e) => isPreview && handleChange(field.id, e.target.value)}
                          className={!isPreview ? "bg-muted" : ""}
                        />
                      </div>
                    );
                }
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

