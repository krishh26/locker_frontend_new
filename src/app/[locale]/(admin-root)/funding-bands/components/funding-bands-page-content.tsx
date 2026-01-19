"use client";

import { PoundSterling } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { FundingBandsDataTable } from "./funding-bands-data-table";

export function FundingBandsPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Funding Bands"
        subtitle="Manage funding bands for courses with streamlined operations including add and update functionalities"
        icon={PoundSterling}
      />

      {/* Data Table */}
      <div className="@container/main">
        <FundingBandsDataTable />
      </div>
    </div>
  );
}

