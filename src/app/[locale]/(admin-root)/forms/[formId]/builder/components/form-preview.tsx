"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormFieldsRenderer } from "@/components/forms/form-fields-renderer";
import type { SimpleFormField } from "@/store/api/forms/types";

interface FormPreviewProps {
  fields: SimpleFormField[];
  formName: string;
  description?: string;
}

export function FormPreview({
  fields,
  formName,
  description,
}: FormPreviewProps) {
  const t = useTranslations("forms.builder.preview");
  const form = useForm({
    defaultValues: fields.reduce((acc, field) => {
      acc[field.id] = field.type === "checkbox" ? [] : "";
      return acc;
    }, {} as Record<string, string | string[]>),
  });

  const formValues = form.watch();

  const handleChange = (fieldId: string, value: string | string[]) => {
    form.setValue(fieldId, value, { shouldDirty: true });
  };

  const onSubmit = (data: unknown) => {
    console.log("Form data:", data);
    // In preview mode, just log the data
  };

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{t("noFields")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-2">{formName || t("untitledForm")}</h2>
        {description && (
          <p className="text-muted-foreground mb-6">{description}</p>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormFieldsRenderer
            fields={fields}
            mode="preview"
            values={formValues}
            onChange={handleChange}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              {t("clearForm")}
            </Button>
            <Button type="submit" disabled>
              {t("submitPreview")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
