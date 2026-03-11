"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { FileText } from "lucide-react";
import { ResourcesDataTable } from "./resources-data-table";
import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";

export function ResourcesPageContent() {
  const t = useTranslations("resources");
  const isLearner = useAppSelector((state) => state.auth.user?.role === 'Learner')
  const isEmployer = useAppSelector((state) => state.auth.user?.role === 'Employer')
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        icon={FileText}
        backButtonHref="/dashboard"
        showBackButton={isLearner || isEmployer}
      />

      {/* Data Table */}
      <div className="@container/main">
        <ResourcesDataTable />
      </div>
    </div>
  );
}
