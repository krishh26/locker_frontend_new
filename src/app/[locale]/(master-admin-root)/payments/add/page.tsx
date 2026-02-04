"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { AddInvoiceForm } from "@/app/[locale]/(master-admin-root)/payments/components/add-invoice-form"

export default function AddInvoicePage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Add invoice"
        subtitle="Record which organisation paid for which plan."
      />
      <AddInvoiceForm />
    </div>
  )
}
  