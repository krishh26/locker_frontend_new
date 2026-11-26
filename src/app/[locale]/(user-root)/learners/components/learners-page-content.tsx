"use client";

import { Folder, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { COURSE_FOLDER_LEGEND } from "@/utils/course-folder-color";
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

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-sm text-muted-foreground">
        {COURSE_FOLDER_LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2">
            <Folder className="size-4 shrink-0" style={{ color: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

