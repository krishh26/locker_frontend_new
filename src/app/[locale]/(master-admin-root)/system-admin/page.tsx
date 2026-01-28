"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { SystemAdminDataTable } from "./components/system-admin-data-table"

export default function SystemAdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="System Admins"
        subtitle="Manage master admin users"
      />
      <SystemAdminDataTable />
    </div>
  )
}
