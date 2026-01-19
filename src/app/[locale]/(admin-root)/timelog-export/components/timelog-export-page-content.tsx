"use client";

import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { TimelogExportFilters } from "./timelog-export-filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TimelogExportPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Timelog Data Export"
        subtitle="Filter and export timelog data to CSV format"
        icon={Download}
      />

      {/* Filter Section */}
      <TimelogExportFilters />

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
          <CardDescription>
            Guidelines for using the timelog data export feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Use the filters above to narrow down the timelog data you want to export</p>
            <p>• The exported CSV file will include all timelog entries matching your selected criteria</p>
            <p>• Date range filters will include entries from the start of &quot;From&quot; date to the end of &quot;To&quot; date</p>
            <p>• &quot;Show only Off the Job Records&quot; will filter to include only off-the-job training activities</p>
            <p>• If no filters are selected, all available timelog data will be exported</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

