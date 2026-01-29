"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { OrganisationsDataTable } from "./components/organisations-data-table"

export default function OrganisationsPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Organisations"
        subtitle="Manage and view all organisations"
      />
      <OrganisationsDataTable />
    </div>
  )
}
