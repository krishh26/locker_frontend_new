"use client";

import { Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SessionTypesDataTable } from "./session-types-data-table";

export function SessionTypesPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Session Types"
        subtitle="Manage session types with ordering, active status, and off-the-job settings"
        icon={Clock}
      />

      {/* Data Table */}
      <div className="@container/main">
        <SessionTypesDataTable />
      </div>
    </div>
  );
}
