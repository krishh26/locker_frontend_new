"use client"

import { HelpCircle } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { SupportDataTable } from "./support-data-table"
import { useTranslations } from "next-intl"

export function SupportPageContent() {
  const t = useTranslations("support")

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={HelpCircle}
      />
      <SupportDataTable />
    </div>
  )
}

