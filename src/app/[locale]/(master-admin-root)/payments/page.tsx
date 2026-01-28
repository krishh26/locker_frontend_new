"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { PaymentsDataTable } from "./components/payments-data-table"

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Payments"
        subtitle="View payment history and transactions"
      />
      <PaymentsDataTable />
    </div>
  )
}
