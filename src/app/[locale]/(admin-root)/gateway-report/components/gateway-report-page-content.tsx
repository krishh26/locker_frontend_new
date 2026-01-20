"use client";

import { FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GatewayReportDataTable } from "./gateway-report-data-table";
import { useTranslations } from "next-intl";

export function GatewayReportPageContent() {
  const t = useTranslations("gatewayReport");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FileBarChart}
      />

      {/* Data Table */}
      <div className="@container/main">
        <GatewayReportDataTable />
      </div>
    </div>
  );
}

