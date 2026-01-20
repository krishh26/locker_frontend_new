"use client";

import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { TimelogExportFilters } from "./timelog-export-filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function TimelogExportPageContent() {
  const t = useTranslations("timelogExport");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Download}
      />

      {/* Filter Section */}
      <TimelogExportFilters />

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("exportInformation.title")}</CardTitle>
          <CardDescription>
            {t("exportInformation.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• {t("exportInformation.guideline1")}</p>
            <p>• {t("exportInformation.guideline2")}</p>
            <p>• {t("exportInformation.guideline3")}</p>
            <p>• {t("exportInformation.guideline4")}</p>
            <p>• {t("exportInformation.guideline5")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

