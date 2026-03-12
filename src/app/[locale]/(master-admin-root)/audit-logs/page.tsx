"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { AuditLogsDataTable } from "./components/audit-logs-data-table"
import { useTranslations } from "next-intl"

export default function AuditLogsPage() {
  const t = useTranslations("auditLogs")
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />
      <AuditLogsDataTable />
    </div>
  )
}
