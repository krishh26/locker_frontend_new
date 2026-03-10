"use client"

import { Lightbulb } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProposeYourInnovationsDataTable } from "./propose-your-innovations-data-table"
import { useTranslations } from "next-intl"

export function ProposeYourInnovationsPageContent() {
  const t = useTranslations("proposeInnovations")

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        icon={Lightbulb}
      />
      <ProposeYourInnovationsDataTable />
    </div>
  )
}

