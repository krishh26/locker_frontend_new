"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormsDataTable } from "./forms/forms-data-table";
import { TemplateListTable } from "./templates-forms/template-list-table";
import { SubmittedFormsDataTable } from "./submitted-forms/submitted-forms-data-table";
import { useTranslations } from "next-intl";

export function FormsPageContent() {
  const t = useTranslations("forms");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FileText}
      />

      {/* Tabs */}
      <Tabs defaultValue="forms" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="forms" className="cursor-pointer">{t("tabs.formList")}</TabsTrigger>
          <TabsTrigger value="templates" className="cursor-pointer">{t("tabs.templateList")}</TabsTrigger>
          <TabsTrigger value="response" className="cursor-pointer">{t("tabs.response")}</TabsTrigger>
        </TabsList>
        <TabsContent value="forms" className="mt-6">
          <div className="@container/main">
            <FormsDataTable />
          </div>
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <div className="@container/main">
            <TemplateListTable />
          </div>
        </TabsContent>
        <TabsContent value="response" className="mt-6">
          <div className="@container/main">
            <SubmittedFormsDataTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

