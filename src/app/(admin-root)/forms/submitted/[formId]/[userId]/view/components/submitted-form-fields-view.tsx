"use client";

import { FormFieldsRenderer } from "@/components/forms/form-fields-renderer";
import type { FormField } from "@/store/api/forms/types";

interface SubmittedFormFieldsViewProps {
  fields: FormField[];
  submittedData: Record<string, string>;
  submittedFiles: Record<string, string> | null;
}

export function SubmittedFormFieldsView({
  fields,
  submittedData,
  submittedFiles,
}: SubmittedFormFieldsViewProps) {
  // Convert submittedData to match FormFieldsRenderer expected format
  const values: Record<string, string | string[]> = {};
  Object.entries(submittedData).forEach(([key, value]) => {
    values[key] = value;
  });

  return (
    <FormFieldsRenderer
      fields={fields}
      mode="submitted"
      values={values}
      files={submittedFiles}
    />
  );
}
