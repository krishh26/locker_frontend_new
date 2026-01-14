"use client";

import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersDataTable } from "./users-data-table";

export function UsersPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="User Management"
        subtitle="Efficiently manage users with streamlined operations including add, delete, and update functionalities"
        icon={Users}
        showBackButton
        backButtonHref="/admin"
      />

      {/* Data Table */}
      <div className="@container/main">
        <UsersDataTable />
      </div>
    </div>
  );
}

