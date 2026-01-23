"use client";

import { Download, History } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportOptionsForm } from "./export-options-form";
import { ExportHistoryTable } from "./export-history-table";

export function DataExportPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Data Export"
        subtitle="Export system data for backup and reporting purposes"
        icon={Download}
        showBackButton
        backButtonHref="/master-admin"
      />

      {/* Export Tabs */}
      <Tabs defaultValue="export" className="w-full">
        <TabsList>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Export History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-6">
          <ExportOptionsForm />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ExportHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
