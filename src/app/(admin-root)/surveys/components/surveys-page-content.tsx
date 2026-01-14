"use client"

import { ClipboardList } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { SurveysDataTable } from "./surveys-data-table"

export function SurveysPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Surveys"
        subtitle="Create and manage survey forms"
        icon={ClipboardList}
      />

      {/* Data Table */}
      <div className="@container/main">
        <SurveysDataTable />
      </div>
    </div>
  )
}

