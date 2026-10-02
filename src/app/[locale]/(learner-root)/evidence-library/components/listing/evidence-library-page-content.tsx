"use client";

import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EvidenceLibraryDataTable } from "./evidence-library-data-table";
import { useTranslations } from "next-intl";
import { useLearnerDashboardHref } from "@/hooks/use-learner-dashboard-href";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

export function EvidenceLibraryPageContent() {
  const t = useTranslations("evidenceLibrary");
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const learnerDashboardHref = useLearnerDashboardHref();
  const backHref = currentCourseId
    ? `/course-details/${currentCourseId}`
    : learnerDashboardHref;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FolderOpen}
        showBackButton
        backButtonHref={backHref}
      />

      {/* Data Table */}
      <div className="@container/main">
        <EvidenceLibraryDataTable />
      </div>
    </div>
  );
}

