"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarView } from "./calendar-view";
import { CalendarFilters } from "./calendar-filters";
import { useGetLearnerPlanListQuery } from "@/store/api/learner-plan/learnerPlanApi";
import type { SessionFilters } from "@/store/api/session/types";
import type { LearningPlanListRequest } from "@/store/api/learner-plan/types";
import { mapLearnerPlansToSessions } from "../utils/session-transform";
import { useTranslations } from "next-intl";

export function CalendarPageContent() {
  const t = useTranslations("calendar");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [filters, setFilters] = useState<SessionFilters>({
    page: 1,
    page_size: 10,
  });

  const request: LearningPlanListRequest = {
    page: filters.page,
    limit: filters.page_size,
    meta: true,
    ...(filters.trainer_id && { assessor_id: filters.trainer_id }),
    ...(filters.Attended && { Attended: filters.Attended }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
  };
  const { data, isLoading } = useGetLearnerPlanListQuery(request);

  const sessions = data?.data ? mapLearnerPlansToSessions(data.data) : [];
  const metaData = data?.meta_data;

  const handleFilterChange = (newFilters: Partial<SessionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleViewModeChange = (mode: "calendar" | "list") => {
    setViewMode(mode);
  };

  const handleExportCSV = () => {
    if (!sessions.length) {
      return;
    }

    // Import CSV export functions
    import("../utils/csv-export").then(({ exportSessionsToCSV, downloadCSV, generateFilename }) => {
      const csvContent = exportSessionsToCSV(sessions);
      const filename = generateFilename("sessions_export");
      downloadCSV(csvContent, filename);
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={CalendarIcon}
      />

      {/* Filters */}
      <CalendarFilters
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onFilterChange={handleFilterChange}
        filters={filters}
        onExportCSV={handleExportCSV}
        isLoading={isLoading}
      />

      {/* Calendar/List View - shows learner plans as sessions */}
      <CalendarView
        viewMode={viewMode}
        sessions={sessions}
        isLoading={isLoading}
        metaData={metaData}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

