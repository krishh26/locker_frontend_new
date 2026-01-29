"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { CentresDataTable } from "./components/centres-data-table"

export default function CentresPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Centres"
        subtitle="Manage and view all centres across organisations"
      />
      <CentresDataTable />
    </div>
  )
}
