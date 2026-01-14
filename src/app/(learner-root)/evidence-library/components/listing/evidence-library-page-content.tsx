"use client";

import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EvidenceLibraryDataTable } from "./evidence-library-data-table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

export function EvidenceLibraryPageContent() {
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Evidence Library"
        subtitle="Manage and organize your evidence files"
        icon={FolderOpen}
        showBackButton
        backButtonHref={`/course-details/${currentCourseId}`}
      />

      {/* Data Table */}
      <div className="@container/main">
        <EvidenceLibraryDataTable />
      </div>
    </div>
  );
}

