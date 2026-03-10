"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SupplementaryTrainingDataTable } from "./supplementary-training-data-table";
import { useTranslations } from "next-intl";

export function SupplementaryTrainingPageContent() {
  const t = useTranslations("supplementaryTraining.learner");
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={BookOpen}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <SupplementaryTrainingDataTable />
      </div>
    </div>
  );
}
