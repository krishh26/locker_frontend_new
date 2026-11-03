"use client";

import { useRef, useState, type HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
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
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { RichTextContent } from "@/components/forms/rich-text-content";
import {
  FIELD_WIDTHS,
  isDisplayOnlyField,
  isTodayDateField,
  type FieldWidth,
} from "@/components/forms/field-types";
import { TableField } from "@/components/forms/table-field";
import { StatementField } from "@/components/forms/statement-field";
import { useTemplateResolver } from "@/components/forms/template-variables";
import { VariableMenu } from "@/components/forms/variable-menu";
import { usePresetLabel } from "@/components/forms/use-preset-label";
import { TableEditor } from "./table-editor";

type DragHandleProps = HTMLAttributes<HTMLDivElement> & {
  ref?: (element: HTMLElement | null) => void;
};

interface FormFieldCardProps {
  field: SimpleFormField;
  isEditing: boolean;
  onEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (updates: Partial<SimpleFormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  dragHandle?: DragHandleProps;
}

export function FormFieldCard({
  field,
  isEditing,
  onEdit,
  onStopEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  dragHandle,
}: FormFieldCardProps) {
  const t = useTranslations("forms.builder.fieldCard");
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
      label: t("optionLabel", { n: newIndex }),
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

  const presetLabel = usePresetLabel();
  const resolveTemplate = useTemplateResolver();
  const isDisplayOnly = isDisplayOnlyField(field.type);
  const isStatement = field.type === "statement";
  const statementRef = useRef<HTMLTextAreaElement>(null);

  const insertStatementVariable = (token: string) => {
    const content = localField.content || "";
    const textarea = statementRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    setLocalField((prev) => ({
      ...prev,
      content: content.slice(0, start) + token + content.slice(end),
    }));
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const renderFieldPreview = () => {
    switch (field.type) {
      case "richtext":
        return field.content ? (
          <RichTextContent html={field.content} />
        ) : (
          <p className="text-sm text-muted-foreground italic">{t("emptyTextBlock")}</p>
        );
      case "table":
        return (
          <TableField
            config={field.table}
            value={{}}
            disabled
            presetPlaceholder={presetLabel}
            idPrefix={field.id}
          />
        );
      case "statement":
        return (
          <StatementField
            id={`${field.id}-preview`}
            required={field.required}
            text={resolveTemplate(field.content || "")}
            checked={false}
            disabled
          />
        );
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
              <SelectValue placeholder={t("selectOption")} />
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
        if (isTodayDateField(field)) {
          return (
            <Input
              value={t("todayAutoFill")}
              disabled
              readOnly
              className="bg-muted"
            />
          );
        }
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
              {t("fileUploadArea")}
            </p>
          </div>
        );
      case "signature":
        return (
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/50 h-32 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">{t("signaturePad")}</p>
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
            <h4 className="font-semibold">✏️ {t("editField")}</h4>
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
            {!isStatement && (
            <div>
              <Label>{isDisplayOnly ? t("blockName") : t("fieldLabel")}</Label>
              <Input
                value={localField.label}
                onChange={(e) =>
                  setLocalField({ ...localField, label: e.target.value })
                }
              />
              {isDisplayOnly && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("blockNameHint")}
                </p>
              )}
            </div>
            )}

            {field.type === "richtext" && (
              <div>
                <Label className="mb-2 block">{t("content")}</Label>
                <RichTextEditor
                  value={localField.content || ""}
                  onChange={(html) =>
                    setLocalField((prev) => ({ ...prev, content: html }))
                  }
                />
              </div>
            )}

            {field.type === "statement" && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label htmlFor={`statement-${field.id}`}>{t("statementText")}</Label>
                  <VariableMenu onInsert={insertStatementVariable} />
                </div>
                <Textarea
                  id={`statement-${field.id}`}
                  ref={statementRef}
                  rows={3}
                  value={localField.content || ""}
                  placeholder={t.raw("statementPlaceholder")}
                  onChange={(e) =>
                    setLocalField((prev) => ({ ...prev, content: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">{t.raw("variablesHint")}</p>
              </div>
            )}

            {field.type === "table" && localField.table && (
              <div>
                <Label className="mb-2 block">{t("tableLayout")}</Label>
                <TableEditor
                  value={localField.table}
                  onChange={(table) => setLocalField((prev) => ({ ...prev, table }))}
                />
              </div>
            )}

            {["text", "email", "phone", "number", "textarea"].includes(
              field.type
            ) && (
              <div>
                <Label>{t("placeholder")}</Label>
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

            {!isDisplayOnly && (
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
              <Label htmlFor={`required-${field.id}`}>{t("requiredField")}</Label>
            </div>
            )}

            {!["file"].includes(field.type) && (
              <div>
                <Label>{t("fieldWidth")}</Label>
                <Select
                  value={localField.width || "full"}
                  onValueChange={(value: FieldWidth) =>
                    setLocalField({ ...localField, width: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_WIDTHS.map((width) => (
                      <SelectItem key={width} value={width}>
                        {t(`widths.${width}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {["select", "radio", "checkbox"].includes(field.type) && (
              <div>
                <Label>{t("options")}</Label>
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
                    {t("addOption")}
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
          <div
            {...dragHandle}
            className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              {isStatement ? (
                <span />
              ) : isDisplayOnly ? (
                <span className="text-xs text-muted-foreground">
                  {t("textBlockTag")}: {field.label}
                </span>
              ) : (
                <Label className="text-sm font-medium">
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
              )}
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

