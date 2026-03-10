"use client";

import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EvidenceLibraryDataTable } from "./evidence-library-data-table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import { useTranslations } from "next-intl";

export function EvidenceLibraryPageContent() {
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const t = useTranslations("evidenceLibrary");
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
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

