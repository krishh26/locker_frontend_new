"use client";

import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { LearningPlanDataTable } from "./learning-plan-data-table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

export function LearningPlanPageContent() {
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Learning Plan"
        subtitle="Manage and track learning sessions"
        icon={Calendar} 
        showBackButton
        backButtonHref={`/course-details/${currentCourseId}`}
      />

      {/* Data Table */}
      <div className="@container/main">
        <LearningPlanDataTable />
      </div>
    </div>
  );
}

