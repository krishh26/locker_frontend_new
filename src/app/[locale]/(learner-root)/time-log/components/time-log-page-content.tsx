"use client";

import { useState } from "react";
import { Clock, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { TimeLogDataTable } from "./time-log-data-table";
import { useTranslations } from "next-intl";

export function TimeLogPageContent() {
  const t = useTranslations("timeLog");
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        icon={Clock}
        backButtonHref="/dashboard"
        showBackButton
        actions={
          !isEmployer ? (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.addButton")}
            </Button>
          ) : undefined
        }
      />

      {/* Data Table */}
      <div className="@container/main">
        <TimeLogDataTable
          createDialogOpen={createDialogOpen}
          onCreateDialogOpenChange={setCreateDialogOpen}
        />
      </div>
    </div>
  );
}
