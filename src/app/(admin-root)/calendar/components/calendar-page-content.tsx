"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarView } from "./calendar-view";
import { CalendarFilters } from "./calendar-filters";
import { useGetSessionsQuery } from "@/store/api/session/sessionApi";
import type { SessionFilters } from "@/store/api/session/types";

export function CalendarPageContent() {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [filters, setFilters] = useState<SessionFilters>({
    page: 1,
    page_size: 10,
  });

  const { data, isLoading } = useGetSessionsQuery(filters);

  const handleFilterChange = (newFilters: Partial<SessionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleViewModeChange = (mode: "calendar" | "list") => {
    setViewMode(mode);
  };

  const handleExportCSV = () => {
    if (!data?.data || data.data.length === 0) {
      return;
    }

    // Import CSV export functions
    import("../utils/csv-export").then(({ exportSessionsToCSV, downloadCSV, generateFilename }) => {
      const csvContent = exportSessionsToCSV(data.data);
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
        title="Calendar"
        subtitle="Manage sessions and appointments"
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

      {/* Calendar/List View */}
      <CalendarView
        viewMode={viewMode}
        sessions={data?.data || []}
        isLoading={isLoading}
        metaData={data?.meta_data}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

