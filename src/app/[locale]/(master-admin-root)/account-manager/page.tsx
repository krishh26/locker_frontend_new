"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { AccountManagerDataTable } from "./components/account-manager-data-table"

export default function AccountManagerPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Account Managers"
        subtitle="Manage account manager users and their organisation assignments"
      />
      <AccountManagerDataTable />
    </div>
  )
}
