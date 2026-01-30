"use client";

import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersDataTable } from "./users-data-table";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { isAccountManager } from "@/utils/permissions";

export function UsersPageContent() {
  const t = useTranslations("users");
  const user = useAppSelector((state) => state.auth.user);
  const backButtonHref = isAccountManager(user) ? "/organisations" : "/admin";

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Users}
        showBackButton
        backButtonHref={backButtonHref}
      />

      {/* Data Table */}
      <div className="@container/main">
        <UsersDataTable />
      </div>
    </div>
  );
}

