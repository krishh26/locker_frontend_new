"use client";

import { useState } from "react";
import { Users, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CaseloadManagerCards } from "./caseload-manager-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCaseloadListQuery } from "@/store/api/caseload/caseloadApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function CaseloadPageContent() {
  const t = useTranslations("caseload");
  const [filterName, setFilterName] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  const { data, isLoading, isError, refetch } = useGetCaseloadListQuery({
    line_manager_name: filterName,
    page,
    limit: rowsPerPage,
    meta: true,
  });

  const lineManagers = data?.data || [];
  const totalCount = data?.meta_data?.total_line_managers || 0;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 pb-6 sm:pb-8 max-w-full min-w-0">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Users}
      />

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="w-full min-w-0 sm:max-w-md sm:flex-1">
          <div className="relative w-full">
            <Input
              placeholder={t("searchPlaceholder")}
              value={filterName}
              onChange={(e) => {
                setPage(1);
                setFilterName(e.target.value);
              }}
              className="pl-10 w-full min-w-0"
            />
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex-1 sm:flex-initial min-w-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${isLoading ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
          {filterName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterName("");
                setPage(1);
              }}
              className="flex-1 sm:flex-initial min-w-0"
            >
              {t("clear")}
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
              <Skeleton className="h-4 w-2/3 sm:w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-14 sm:h-16 flex-1 min-w-0" />
                <Skeleton className="h-14 sm:h-16 flex-1 min-w-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {/* {isError && (
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="min-w-0">
            {t("failedToLoad")}
          </AlertDescription>
        </Alert>
      )} */}

      {/* Manager Cards */}
      {!isLoading && (
        <CaseloadManagerCards
          lineManagers={lineManagers}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* No Data State */}
      {!isLoading && lineManagers.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-6 sm:p-8 md:p-12 text-center w-full min-w-0">
          <div className="inline-flex items-center justify-center rounded-full bg-primary p-3 mb-3 sm:mb-4">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 px-2">{t("noLineManagersFound")}</h3>
          <p className="text-muted-foreground text-sm sm:text-base px-2">
            {filterName
              ? `${t("noLineManagersMatch")} "${filterName}"`
              : t("noLineManagersInSystem")}
          </p>
        </div>
      )}
    </div>
  );
}
