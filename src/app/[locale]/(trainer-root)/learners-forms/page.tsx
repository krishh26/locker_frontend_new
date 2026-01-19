"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubmittedFormsDataTable } from "@/app/[locale]/(admin-root)/forms/components/submitted-forms/submitted-forms-data-table";

export function LearnersFormsPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title="Learner Submitted Forms"
        subtitle="View and manage all learner submitted forms"
        icon={FileText}
      />
      <SubmittedFormsDataTable />
    </div>
  );
}

export default LearnersFormsPageContent;

