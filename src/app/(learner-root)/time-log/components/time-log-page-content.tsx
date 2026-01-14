"use client";

import { Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { TimeLogDataTable } from "./time-log-data-table";

export function TimeLogPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Time Log"
        subtitle="Viewing E-Timelog for All Courses and General Activities"
        icon={Clock}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <TimeLogDataTable />
      </div>
    </div>
  );
}
