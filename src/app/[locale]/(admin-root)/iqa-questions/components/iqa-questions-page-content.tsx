"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { IQAQuestionsDataTable } from "./iqa-questions-data-table";
import { useTranslations } from "next-intl";

export function IQAQuestionsPageContent() {
  const t = useTranslations("iqaQuestions");
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>("");

  const questionTypeOptions = [
    t("questionTypes.all"),
    t("questionTypes.observeAssessor"),
    t("questionTypes.learnerInterview"),
    t("questionTypes.employerInterview"),
    t("questionTypes.finalCheck"),
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={HelpCircle}
      />

      {/* Data Table */}
      <div className="@container/main">
        <IQAQuestionsDataTable
          selectedQuestionType={selectedQuestionType}
          onQuestionTypeChange={setSelectedQuestionType}
          questionTypeOptions={questionTypeOptions}
        />
      </div>
    </div>
  );
}