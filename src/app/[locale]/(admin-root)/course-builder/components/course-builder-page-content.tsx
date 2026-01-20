"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CourseBuilderDataTable } from "./course-builder-data-table";
import { useTranslations } from "next-intl";

export function CourseBuilderPageContent() {
  const t = useTranslations("courseBuilder");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={BookOpen}
      />

      {/* Data Table */}
      <div className="@container/main">
        <CourseBuilderDataTable />
      </div>
    </div>
  );
}

