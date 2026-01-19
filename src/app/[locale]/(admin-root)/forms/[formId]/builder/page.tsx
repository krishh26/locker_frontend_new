import { use } from "react";
import { FormBuilder } from "./components/form-builder";

interface BuilderPageProps {
  params: Promise<{ formId: string }>;
}

export default function BuilderPage({ params }: BuilderPageProps) {
  const { formId } = use(params);
  return <FormBuilder formId={formId === "new" ? null : formId} />;
}

