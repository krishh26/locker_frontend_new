"use client";

import { FileSignature } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AwaitingSignatureDataTable } from "./awaiting-signature-data-table";

export function AwaitingSignaturePageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Awaiting Signature"
        subtitle="Files and documents awaiting signatures from Trainer and learners"
        icon={FileSignature}
      />

      {/* Data Table */}
      <div className="@container/main">
        <AwaitingSignatureDataTable />
      </div>
    </div>
  );
}

