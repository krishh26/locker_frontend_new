"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { SystemAdminDataTable } from "./components/system-admin-data-table"
import { useTranslations } from "next-intl"

export default function SystemAdminPage() {
  const t = useTranslations("systemAdmin")

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />
      <SystemAdminDataTable />
    </div>
  )
}
