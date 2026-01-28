"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { OrganisationsDataTable } from "./components/organisations-data-table"

export default function OrganisationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Organisations"
        subtitle="Manage and view all organisations"
      />
      <OrganisationsDataTable />
    </div>
  )
}
