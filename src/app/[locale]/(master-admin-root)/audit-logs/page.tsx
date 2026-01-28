"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { AuditLogsDataTable } from "./components/audit-logs-data-table"

export default function AuditLogsPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Audit Logs"
        subtitle="View system activity and changes"
      />
      <AuditLogsDataTable />
    </div>
  )
}
