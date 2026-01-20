"use client";

import { Heart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { WellbeingResourcesDataTable } from "./wellbeing-resources-data-table";
import { useTranslations } from "next-intl";

export function WellbeingResourcesPageContent() {
  const t = useTranslations("wellbeing");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Heart}
      />

      {/* Data Table */}
      <div className="@container/main">
        <WellbeingResourcesDataTable />
      </div>
    </div>
  );
}

