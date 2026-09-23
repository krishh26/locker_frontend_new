"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleUnitProgressLearnerInfoCard } from "./module-unit-progress-learner-info-card";
import { ModuleUnitProgressDataTable } from "./module-unit-progress-data-table";
import { GapColorLegend } from "./gap-color-legend";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import { useTranslations } from "next-intl";

export function GapAnalysisPageContent() {
  const t = useTranslations("gapAnalysis");
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  return (
    <div className="min-w-0 space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={BookOpen}
        showBackButton
        backButtonHref={`/course-details/${currentCourseId}`}
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

