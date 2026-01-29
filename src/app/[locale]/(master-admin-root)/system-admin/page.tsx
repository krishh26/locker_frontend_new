"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { SystemAdminDataTable } from "./components/system-admin-data-table"

export default function SystemAdminPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="System Admins"
        subtitle="Manage master admin users"
      />
      <SystemAdminDataTable />
    </div>
  )
}
