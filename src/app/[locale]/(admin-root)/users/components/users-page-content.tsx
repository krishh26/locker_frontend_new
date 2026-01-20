"use client";

import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersDataTable } from "./users-data-table";
import { useTranslations } from "next-intl";

export function UsersPageContent() {
  const t = useTranslations("users");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Users}
        showBackButton
        backButtonHref="/admin"
      />

      {/* Data Table */}
      <div className="@container/main">
        <UsersDataTable />
      </div>
    </div>
  );
}

