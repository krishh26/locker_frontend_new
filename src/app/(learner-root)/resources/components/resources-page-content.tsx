"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { FileText } from "lucide-react";
import { ResourcesDataTable } from "./resources-data-table";

export function ResourcesPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Resources"
        subtitle="Manage learning resources and materials"
        icon={FileText}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <ResourcesDataTable />
      </div>
    </div>
  );
}
