"use client";

import { Ban } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProgressExclusionForm } from "./progress-exclusion-form";

export function ProgressExclusionPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Exclude From Overall Progress"
        subtitle="Select a course and choose which training statuses should be excluded from overall progress tracking"
        icon={Ban}
      />

      {/* Form Component */}
      <ProgressExclusionForm />
    </div>
  );
}

