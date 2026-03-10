"use client";

import { School } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CpdLearnerInfoCard } from "./cpd-learner-info-card";
import { CpdDataTable } from "./cpd-data-table";
import { useTranslations } from "next-intl";

export function CpdPageContent() {
  const t = useTranslations("cpd");
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={School}
      />

      {/* Learner Information Card */}
      <CpdLearnerInfoCard />

      {/* Data Table */}
      <div className="@container/main">
        <CpdDataTable />
      </div>
    </div>
  );
}

