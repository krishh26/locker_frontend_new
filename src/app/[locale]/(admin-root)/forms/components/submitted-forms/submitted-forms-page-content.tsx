"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubmittedFormsDataTable } from "./submitted-forms-data-table";

export function SubmittedFormsPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title="Submitted Forms"
        subtitle="View and manage all submitted forms"
        icon={FileText}
      />
      <SubmittedFormsDataTable />
    </div>
  );
}

