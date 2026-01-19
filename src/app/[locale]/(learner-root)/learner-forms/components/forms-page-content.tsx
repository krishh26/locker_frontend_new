"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { FormsDataTable } from "./forms-data-table";

export function FormsPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title="Forms"
        subtitle="View and manage all forms"
        icon={FileText}
      />
      <FormsDataTable />
    </div>
  );
}

