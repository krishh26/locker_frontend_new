import { use } from "react";
import { FormView } from "./components/form-view";

interface FormViewPageProps {
  params: Promise<{ formId: string }>;
}

export default function FormViewPage({ params }: FormViewPageProps) {
  const { formId } = use(params);
  return <FormView formId={formId} />;
}

