"use client";

import { FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GatewayReportDataTable } from "./gateway-report-data-table";

export function GatewayReportPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Gateway Report"
        subtitle="View and export gateway ready learner data"
        icon={FileBarChart}
      />

      {/* Data Table */}
      <div className="@container/main">
        <GatewayReportDataTable />
      </div>
    </div>
  );
}

