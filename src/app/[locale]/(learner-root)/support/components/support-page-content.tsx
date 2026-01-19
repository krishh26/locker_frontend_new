"use client"

import { HelpCircle } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { SupportDataTable } from "./support-data-table"

export function SupportPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title="Support"
        subtitle="Submit and manage support requests"
        icon={HelpCircle}
      />
      <SupportDataTable />
    </div>
  )
}

