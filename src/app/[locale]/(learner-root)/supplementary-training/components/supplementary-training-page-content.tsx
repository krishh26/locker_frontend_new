"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SupplementaryTrainingDataTable } from "./supplementary-training-data-table";

export function SupplementaryTrainingPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Supplementary Training"
        subtitle="Access your supplementary training resources and track your progress"
        icon={BookOpen}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <SupplementaryTrainingDataTable />
      </div>
    </div>
  );
}
