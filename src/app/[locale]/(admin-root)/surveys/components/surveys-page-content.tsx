"use client"

import { ClipboardList } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { SurveysDataTable } from "./surveys-data-table"
import { useTranslations } from "next-intl"

export function SurveysPageContent() {
  const t = useTranslations("surveys");
  
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={ClipboardList}
      />

      {/* Data Table */}
      <div className="@container/main">
        <SurveysDataTable />
      </div>
    </div>
  )
}

