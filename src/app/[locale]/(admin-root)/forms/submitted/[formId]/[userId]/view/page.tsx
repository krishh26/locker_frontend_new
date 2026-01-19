import { use } from "react";
import { SubmittedFormView } from "./components/submitted-form-view";

interface SubmittedFormViewPageProps {
  params: Promise<{ formId: string; userId: string }>;
}

export default function SubmittedFormViewPage({ params }: SubmittedFormViewPageProps) {
  const { formId, userId } = use(params);
  return <SubmittedFormView formId={formId} userId={userId} />;
}

