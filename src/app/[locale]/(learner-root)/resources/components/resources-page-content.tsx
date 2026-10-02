"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { FileText } from "lucide-react";
import { ResourcesDataTable } from "./resources-data-table";
import { useTranslations } from "next-intl";
import { useLearnerDashboardHref } from "@/hooks/use-learner-dashboard-href";

export function ResourcesPageContent() {
  const t = useTranslations("resources");
  const backHref = useLearnerDashboardHref();
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        icon={FileText}
        backButtonHref={backHref}
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <ResourcesDataTable />
      </div>
    </div>
  );
}
