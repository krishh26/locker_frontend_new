"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { FormsDataTable } from "./forms-data-table";
import { useTranslations } from "next-intl";

export function FormsPageContent() {
  const t = useTranslations("learnerForms");
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FileText}
      />
      <FormsDataTable />
    </div>
  );
}

