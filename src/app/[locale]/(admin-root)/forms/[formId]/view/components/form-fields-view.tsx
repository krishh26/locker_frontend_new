"use client";

import { FormFieldsRenderer } from "@/components/forms/form-fields-renderer";
import type { FormField } from "@/store/api/forms/types";

interface FormFieldsViewProps {
  fields: FormField[];
}

export function FormFieldsView({ fields }: FormFieldsViewProps) {
  return <FormFieldsRenderer fields={fields} mode="preview" />;
}
