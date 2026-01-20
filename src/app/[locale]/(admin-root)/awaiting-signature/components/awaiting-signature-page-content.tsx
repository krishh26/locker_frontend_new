"use client";

import { FileSignature } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AwaitingSignatureDataTable } from "./awaiting-signature-data-table";
import { useTranslations } from "next-intl";

export function AwaitingSignaturePageContent() {
  const t = useTranslations("awaitingSignature");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FileSignature}
      />

      {/* Data Table */}
      <div className="@container/main">
        <AwaitingSignatureDataTable />
      </div>
    </div>
  );
}

