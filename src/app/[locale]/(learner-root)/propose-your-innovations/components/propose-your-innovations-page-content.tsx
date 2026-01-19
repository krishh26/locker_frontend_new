"use client"

import { Lightbulb } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProposeYourInnovationsDataTable } from "./propose-your-innovations-data-table"

export function ProposeYourInnovationsPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title="Propose Your Innovations"
        subtitle="Share your ideas and innovations with the team"
        icon={Lightbulb}
      />
      <ProposeYourInnovationsDataTable />
    </div>
  )
}

