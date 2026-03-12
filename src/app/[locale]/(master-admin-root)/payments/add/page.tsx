"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { AddInvoiceForm } from "@/app/[locale]/(master-admin-root)/payments/components/add-invoice-form"
import { useTranslations } from "next-intl"

export default function AddInvoicePage() {
  const t = useTranslations("payments")
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("addPage.title")}
        subtitle={t("addPage.subtitle")}
      />
      <AddInvoiceForm />
    </div>
  )
}
  