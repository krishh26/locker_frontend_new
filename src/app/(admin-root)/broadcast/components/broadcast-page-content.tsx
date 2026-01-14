"use client";

import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { BroadcastDataTable } from "./broadcast-data-table";

export function BroadcastPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Broadcast Management"
        subtitle="Create and manage broadcast messages, send notifications to users, learners, or specific courses"
        icon={Megaphone}
        showBackButton
        backButtonHref="/admin"
      />

      {/* Data Table */}
      <div className="@container/main">
        <BroadcastDataTable />
      </div>
    </div>
  );
}

