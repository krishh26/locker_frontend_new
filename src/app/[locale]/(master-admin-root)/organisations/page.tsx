"use client"

import { useTranslations } from "next-intl"
import { PageHeader } from "@/components/dashboard/page-header"
import { OrganisationsDataTable } from "./components/organisations-data-table"

export default function OrganisationsPage() {
  const t = useTranslations("organisations.page")
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <OrganisationsDataTable />
    </div>
  )
}
