"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubmittedFormsDataTable } from "./submitted-forms-data-table";
import { useTranslations } from "next-intl";

export function SubmittedFormsPageContent() {
  const t = useTranslations("forms");
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={t("submittedForms.pageTitle")}
        subtitle={t("submittedForms.pageSubtitle")}
        icon={FileText}
      />
      <SubmittedFormsDataTable />
    </div>
  );
}

