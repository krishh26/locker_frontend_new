"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubmittedFormsDataTable } from "@/app/[locale]/(admin-root)/forms/components/submitted-forms/submitted-forms-data-table";
import { useTranslations } from "next-intl";

export function LearnersFormsPageContent() {
  const t = useTranslations("learnersForms");

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        icon={FileText}
      />
      <SubmittedFormsDataTable />
    </div>
  );
}

export default LearnersFormsPageContent;

