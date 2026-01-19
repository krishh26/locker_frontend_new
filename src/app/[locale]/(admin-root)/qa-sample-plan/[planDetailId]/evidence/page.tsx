"use client";

import { use } from "react";
import { ExamineEvidencePageContent } from "./components/examine-evidence-page-content";

export default function ExamineEvidencePage({
  params,
}: {
  params: Promise<{ planDetailId: string }>;
}) {
  const { planDetailId } = use(params);
  return <ExamineEvidencePageContent planDetailId={planDetailId} />;
}
