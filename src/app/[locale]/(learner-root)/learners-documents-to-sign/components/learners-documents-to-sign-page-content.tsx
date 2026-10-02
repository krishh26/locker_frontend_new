"use client";

import { FileSignature } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/page-header";
import { LearnersDocumentsToSignDataTable } from "./learners-documents-to-sign-data-table";
import { useLearnerDashboardHref } from "@/hooks/use-learner-dashboard-href";

export function LearnersDocumentsToSignPageContent() {
  const t = useTranslations("learnerDocumentsToSign");
  const backHref = useLearnerDashboardHref();
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FileSignature}
        backButtonHref={backHref}
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <LearnersDocumentsToSignDataTable />
      </div>
    </div>
  );
}

