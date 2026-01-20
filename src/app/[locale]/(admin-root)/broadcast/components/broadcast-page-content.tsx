"use client";

import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { BroadcastDataTable } from "./broadcast-data-table";
import { useTranslations } from "next-intl";

export function BroadcastPageContent() {
  const t = useTranslations("broadcast");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Megaphone}
        showBackButton
        backButtonHref="/admin"
      />

      {/* Data Table */}
      <div className="@container/main">
        <BroadcastDataTable />
      </div>
    </div>
  );
}

