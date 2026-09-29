"use client"

import { Ticket } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { TicketsDataTable } from "./tickets-data-table"
import { useTranslations } from "next-intl"

export function TicketsPageContent() {
  const t = useTranslations("tickets")

  return (
    <div className="w-full space-y-6 px-4 lg:px-6">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Ticket}
      />
      <div className="w-full">
        <TicketsDataTable />
      </div>
    </div>
  )
}
