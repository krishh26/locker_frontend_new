"use client";

import { Heart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthWellbeingDataTable } from "./health-wellbeing-data-table";
import { useTranslations } from "next-intl";

export function HealthWellbeingPageContent() {
  const t = useTranslations("healthAndWellbeing");
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Heart}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <HealthWellbeingDataTable />
      </div>
    </div>
  );
}
