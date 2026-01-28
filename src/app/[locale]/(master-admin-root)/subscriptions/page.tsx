"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { SubscriptionsDataTable } from "./components/subscriptions-data-table"

export default function SubscriptionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Subscriptions"
        subtitle="View and manage organisation subscriptions"
      />
      <SubscriptionsDataTable />
    </div>
  )
}
