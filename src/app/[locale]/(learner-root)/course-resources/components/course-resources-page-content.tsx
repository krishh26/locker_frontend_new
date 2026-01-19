"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CourseResourcesDataTable } from "./course-resources-data-table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

export function CourseResourcesPageContent() {
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Course Resources"
        subtitle="Access and manage course learning resources"
        icon={BookOpen}
        showBackButton
        backButtonHref={`/course-details/${currentCourseId}`}
      />

      {/* Data Table */}
      <div className="@container/main">
        <CourseResourcesDataTable />
      </div>
    </div>
  );
}

