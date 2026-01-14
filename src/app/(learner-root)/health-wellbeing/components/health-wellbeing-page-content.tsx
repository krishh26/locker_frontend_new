"use client";

import { Heart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthWellbeingDataTable } from "./health-wellbeing-data-table";

export function HealthWellbeingPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Health and Wellbeing"
        subtitle="Access your wellbeing resources and track your progress"
        icon={Heart}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <HealthWellbeingDataTable />
      </div>
    </div>
  );
}
