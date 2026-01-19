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

export function CaseloadPageContent() {
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
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Caseload Management"
        subtitle="Manage and view line managers and their assigned users"
        icon={Users}
      />

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Input
              placeholder="Search line managers by name or email..."
              value={filterName}
              onChange={(e) => {
                setPage(1);
                setFilterName(e.target.value);
              }}
              className="pl-10"
            />
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {filterName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterName("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load caseload data. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Manager Cards */}
      {!isLoading && !isError && (
        <CaseloadManagerCards
          lineManagers={lineManagers}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* No Data State */}
      {!isLoading && !isError && lineManagers.length === 0 && (
        <div className="border rounded-lg p-12 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Line Managers Found</h3>
          <p className="text-muted-foreground">
            {filterName
              ? `No line managers match "${filterName}"`
              : "There are no line managers in the system yet."}
          </p>
        </div>
      )}
    </div>
  );
}
