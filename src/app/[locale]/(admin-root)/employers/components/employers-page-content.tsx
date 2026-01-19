"use client";

import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmployersDataTable } from "./employers-data-table";

export function EmployersPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Employer Management"
        subtitle="Manage employer information, add, update, and delete employer records, and assign learners to employers"
        icon={Building2}
        showBackButton
        backButtonHref="/admin"
      />

      {/* Data Table */}
      <div className="@container/main">
        <EmployersDataTable />
      </div>
    </div>
  );
}

