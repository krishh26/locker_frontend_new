"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CourseBuilderDataTable } from "./course-builder-data-table";

export function CourseBuilderPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Course Builder"
        subtitle="Create, manage, and organize your courses with ease"
        icon={BookOpen}
      />

      {/* Data Table */}
      <div className="@container/main">
        <CourseBuilderDataTable />
      </div>
    </div>
  );
}

