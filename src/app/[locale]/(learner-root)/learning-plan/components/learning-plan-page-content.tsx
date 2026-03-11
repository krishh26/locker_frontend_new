"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/page-header";
import { LearningPlanDataTable } from "./learning-plan-data-table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

export function LearningPlanPageContent() {
  const t = useTranslations("learningPlan");
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
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

