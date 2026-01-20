"use client";

import { PoundSterling } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { FundingBandsDataTable } from "./funding-bands-data-table";
import { useTranslations } from "next-intl";

export function FundingBandsPageContent() {
  const t = useTranslations("fundingBands");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={PoundSterling}
      />

      {/* Data Table */}
      <div className="@container/main">
        <FundingBandsDataTable />
      </div>
    </div>
  );
}

