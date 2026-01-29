"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { FeatureControlDataTable } from "./components/feature-control-data-table"

export default function FeatureControlPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Feature Control"
        subtitle="Manage features and their plan mappings"
      />
      <FeatureControlDataTable />
    </div>
  )
}
