"use client";

import { use } from "react";
import { FormSubmitPageContent } from "./components/form-submit-page-content";

export default function FormSubmitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FormSubmitPageContent formId={id} />;
}

