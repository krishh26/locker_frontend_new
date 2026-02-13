"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useTranslations } from "next-intl";
import { SupplementaryTrainingResourcesDataTable } from "./supplementary-training-resources-data-table";

export function SupplementaryTrainingResourcesPageContent() {
  const t = useTranslations("supplementaryTraining");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={BookOpen}
      />

      {/* Data Table */}
      <div className="@container/main">
        <SupplementaryTrainingResourcesDataTable />
      </div>
    </div>
  );
}
