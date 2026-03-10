"use client";

import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { LearnersDataTable } from "./learners-data-table";
import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";

export function LearnersPageContent() {
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const isAdmin = userRole === "Admin";

  const t = useTranslations("learners.page");

  const title = t("title");
  const subtitle = isAdmin ? t("adminSubtitle") : t("defaultSubtitle");

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={GraduationCap}
        showBackButton={isAdmin}
        backButtonHref={isAdmin ? "/admin" : "/learner-overview"}
      />

      {/* Data Table */}
      <div className="@container/main">
        <LearnersDataTable />
      </div>
    </div>
  );
}

