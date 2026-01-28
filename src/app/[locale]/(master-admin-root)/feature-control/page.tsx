"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { FeatureControlDataTable } from "./components/feature-control-data-table"

export default function FeatureControlPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Feature Control"
        subtitle="Manage features and their plan mappings"
      />
      <FeatureControlDataTable />
    </div>
  )
}
