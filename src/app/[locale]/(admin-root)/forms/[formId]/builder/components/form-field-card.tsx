"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  GripVertical,
  Edit,
  Trash2,
  Copy,
  Check,
  X,
  Plus,
} from "lucide-react";
import type { SimpleFormField } from "@/store/api/forms/types";

interface FormFieldCardProps {
  field: SimpleFormField;
  isEditing: boolean;
  onEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (updates: Partial<SimpleFormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function FormFieldCard({
  field,
  isEditing,
  onEdit,
  onStopEdit,
  onUpdate,
  onDelete,
  onDuplicate,
}: FormFieldCardProps) {
  const [localField, setLocalField] = useState(field);

  const handleSave = () => {
    onUpdate(localField);
    onStopEdit();
  };

  const handleCancel = () => {
    setLocalField(field);
    onStopEdit();
  };

  const addOption = () => {
    const currentOptions = localField.options || [];
    const newIndex = currentOptions.length + 1;
    const newOption = {
      label: `Option ${newIndex}`,
      value: `option_${newIndex}`,
    };
    setLocalField({
      ...localField,
      options: [...currentOptions, newOption],
    });
  };

  const updateOption = (index: number, newLabel: string) => {
    const currentOptions = [...(localField.options || [])];
    currentOptions[index] = {
      label: newLabel,
      value: newLabel.toLowerCase().replace(/\s+/g, "_"),
    };
    setLocalField({
      ...localField,
      options: currentOptions,
    });
  };

  const removeOption = (index: number) => {
    const newOptions = (localField.options || []).filter((_, i) => i !== index);
    setLocalField({
      ...localField,
      options: newOptions,
    });
  };

  const renderFieldPreview = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            type={field.type === "email" ? "email" : "text"}
            placeholder={field.placeholder}
            disabled
            className="bg-muted"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            disabled
            className="bg-muted"
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            disabled
            className="bg-muted"
            rows={3}
          />
        );
      case "select":
        return (
          <Select disabled>
            <SelectTrigger className="bg-muted">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup disabled>
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox id={`${field.id}-${index}`} disabled />
                <Label htmlFor={`${field.id}-${index}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            disabled
            className="bg-muted"
          />
        );
      case "file":
        return (
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/50">
            <p className="text-sm text-muted-foreground">
              File upload area
            </p>
          </div>
        );
      case "signature":
        return (
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/50 h-32 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Signature pad</p>
          </div>
        );
      default:
        return (
          <Input
            placeholder={field.placeholder}
            disabled
            className="bg-muted"
          />
        );
    }
  };

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">✏️ Edit Field</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Field Label</Label>
              <Input
                value={localField.label}
                onChange={(e) =>
                  setLocalField({ ...localField, label: e.target.value })
                }
              />
            </div>

            {["text", "email", "phone", "number", "textarea"].includes(
              field.type
            ) && (
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={localField.placeholder || ""}
                  onChange={(e) =>
                    setLocalField({
                      ...localField,
                      placeholder: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`required-${field.id}`}
                checked={localField.required || false}
                onCheckedChange={(checked) =>
                  setLocalField({
                    ...localField,
                    required: checked as boolean,
                  })
                }
              />
              <Label htmlFor={`required-${field.id}`}>Required field</Label>
            </div>

            {!["file"].includes(field.type) && (
              <div>
                <Label>Field Width</Label>
                <Select
                  value={localField.width || "full"}
                  onValueChange={(value: "full" | "half" | "third") =>
                    setLocalField({ ...localField, width: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Width</SelectItem>
                    <SelectItem value="half">Half Width</SelectItem>
                    <SelectItem value="third">One Third</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {["select", "radio", "checkbox"].includes(field.type) && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {(localField.options || []).map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option.label}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="">
        <div className="flex items-start gap-2">
          <div className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  className="h-7 w-7 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDuplicate}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {renderFieldPreview()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

