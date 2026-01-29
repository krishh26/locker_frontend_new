"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { PaymentsDataTable } from "./components/payments-data-table"

export default function PaymentsPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Payments"
        subtitle="View payment history and transactions"
      />
      <PaymentsDataTable />
    </div>
  )
}
