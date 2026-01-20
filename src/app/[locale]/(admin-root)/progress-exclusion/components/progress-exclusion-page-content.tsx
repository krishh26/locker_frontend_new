"use client";

import { Ban } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProgressExclusionForm } from "./progress-exclusion-form";
import { useTranslations } from "next-intl";

export function ProgressExclusionPageContent() {
  const t = useTranslations("progressExclusion");
  
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Ban}
      />

      {/* Form Component */}
      <ProgressExclusionForm />
    </div>
  );
}

