"use client";

import { FileSignature } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { LearnersDocumentsToSignDataTable } from "./learners-documents-to-sign-data-table";

export function LearnersDocumentsToSignPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Learners Documents to Sign"
        subtitle="View and sign documents pending your signature"
        icon={FileSignature}
        backButtonHref="/dashboard"
        showBackButton
      />

      {/* Data Table */}
      <div className="@container/main">
        <LearnersDocumentsToSignDataTable />
      </div>
    </div>
  );
}

