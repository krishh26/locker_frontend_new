"use client"

import { Ticket } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { TicketsDataTable } from "./tickets-data-table"

export function TicketsPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title="Tickets"
        subtitle="Raise and manage tickets"
        icon={Ticket}
      />
      <TicketsDataTable />
    </div>
  )
}
