"use client";

import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ChooseUnitsForm } from "./choose-units-form";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import { useTranslations } from "next-intl";

export function ChooseUnitsPageContent() {
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const t = useTranslations("chooseUnits");
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-24">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={ClipboardList}
        backButtonHref={currentCourseId ? `/course-details/${currentCourseId}` : "/"}
        showBackButton
      />

      {/* Form with Table and Summary Footer */}
      <div className="@container/main">
        <ChooseUnitsForm />
      </div>
    </div>
  );
}

