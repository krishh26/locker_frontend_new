"use client";

import { Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { TimeLogDataTable } from "./time-log-data-table";
import { useTranslations } from "next-intl";

export function TimeLogPageContent() {
  const t = useTranslations("timeLog");

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        icon={Clock}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <TimeLogDataTable />
      </div>
    </div>
  );
}
