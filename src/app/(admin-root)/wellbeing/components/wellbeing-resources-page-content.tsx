"use client";

import { Heart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { WellbeingResourcesDataTable } from "./wellbeing-resources-data-table";

export function WellbeingResourcesPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Wellbeing Resources Management"
        subtitle="Manage wellbeing resources for learners, including adding, editing, and toggling resource availability"
        icon={Heart}
      />

      {/* Data Table */}
      <div className="@container/main">
        <WellbeingResourcesDataTable />
      </div>
    </div>
  );
}

