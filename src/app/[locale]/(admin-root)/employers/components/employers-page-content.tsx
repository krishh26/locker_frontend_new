"use client";

import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmployersDataTable } from "./employers-data-table";
import { useTranslations } from "next-intl";

export function EmployersPageContent() {
  const t = useTranslations("employers");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Building2}
        showBackButton
        backButtonHref="/admin"
      />

      {/* Data Table */}
      <div className="@container/main">
        <EmployersDataTable />
      </div>
    </div>
  );
}

