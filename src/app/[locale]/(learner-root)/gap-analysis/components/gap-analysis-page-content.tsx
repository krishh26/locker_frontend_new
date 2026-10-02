"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleUnitProgressLearnerInfoCard } from "./module-unit-progress-learner-info-card";
import { ModuleUnitProgressDataTable } from "./module-unit-progress-data-table";
import { GapColorLegend } from "./gap-color-legend";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import { useTranslations } from "next-intl";
import { useLearnerDashboardHref } from "@/hooks/use-learner-dashboard-href";

export function GapAnalysisPageContent() {
  const t = useTranslations("gapAnalysis");
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const learnerDashboardHref = useLearnerDashboardHref();
  return (
    <div className="min-w-0 space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={BookOpen}
        showBackButton
        backButtonHref={
          currentCourseId
            ? `/course-details/${currentCourseId}`
            : learnerDashboardHref
        }
      />

      {/* Learner Information Card */}
      <ModuleUnitProgressLearnerInfoCard />

      {/* Data Table */}
      <div className="@container/main min-w-0">
        <ModuleUnitProgressDataTable />
      </div>

      <GapColorLegend />
    </div>
  );
}

