"use client";

import { FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { AuditLogsDataTable } from "./audit-logs-data-table";
import { AuditLogFilters } from "./audit-log-filters";

export function AuditLogsPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Audit Logs"
        subtitle="View system activity logs and user actions for compliance"
        icon={FileText}
        showBackButton
        backButtonHref="/master-admin"
      />

      {/* Filters */}
      <AuditLogFilters />

      {/* Data Table */}
      <div className="@container/main">
        <AuditLogsDataTable />
      </div>
    </div>
  );
}
