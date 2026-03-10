"use client"

import { useTranslations } from "next-intl"
import { PageHeader } from "@/components/dashboard/page-header"
import { CentresDataTable } from "./components/centres-data-table"

export default function CentresPage() {
  const t = useTranslations("centres.page")
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <CentresDataTable />
    </div>
  )
}
