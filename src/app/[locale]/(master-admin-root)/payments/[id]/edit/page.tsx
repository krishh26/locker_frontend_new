"use client"

import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { AddInvoiceForm } from "@/app/[locale]/(master-admin-root)/payments/components/add-invoice-form"
import { useTranslations } from "next-intl"

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations("payments")
  const id = params?.id

  const paymentId =
    typeof id === "string" ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : NaN

  useEffect(() => {
    if (Number.isNaN(paymentId) || paymentId < 1) {
      router.replace("/payments")
    }
  }, [paymentId, router])

  if (Number.isNaN(paymentId) || paymentId < 1) {
    return null
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("editPage.title")}
        subtitle={t("editPage.subtitle")}
      />
      <AddInvoiceForm paymentId={paymentId} />
    </div>
  )
}
