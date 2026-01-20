"use client";

import { Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SessionTypesDataTable } from "./session-types-data-table";
import { useTranslations } from "next-intl";

export function SessionTypesPageContent() {
  const t = useTranslations("sessionTypes");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Clock}
      />

      {/* Data Table */}
      <div className="@container/main">
        <SessionTypesDataTable />
      </div>
    </div>
  );
}
