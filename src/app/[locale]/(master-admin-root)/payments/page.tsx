"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { PaymentsDataTable } from "./components/payments-data-table"
import { useTranslations } from "next-intl"

export default function PaymentsPage() {
  const t = useTranslations("payments")
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />
      <PaymentsDataTable />
    </div>
  )
}
