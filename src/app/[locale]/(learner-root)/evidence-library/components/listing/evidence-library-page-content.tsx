"use client";

import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EvidenceLibraryDataTable } from "./evidence-library-data-table";
import { useTranslations } from "next-intl";

export function EvidenceLibraryPageContent() {
  const t = useTranslations("evidenceLibrary");
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FolderOpen}
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <EvidenceLibraryDataTable />
      </div>
    </div>
  );
}

