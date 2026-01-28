"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { CentresDataTable } from "./components/centres-data-table"

export default function CentresPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Centres"
        subtitle="Manage and view all centres across organisations"
      />
      <CentresDataTable />
    </div>
  )
}
