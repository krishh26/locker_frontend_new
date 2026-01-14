"use client";

import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { LearnersDataTable } from "./learners-data-table";

export function LearnersPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Learner Management"
        subtitle="Optimize learner administration by seamlessly adding, updating, and deleting learners, while also facilitating the assignment of courses, trainers, employers, IQAs, and EQAs"
        icon={GraduationCap}
        showBackButton
        backButtonHref="/admin"
      />

      {/* Data Table */}
      <div className="@container/main">
        <LearnersDataTable />
      </div>
    </div>
  );
}

