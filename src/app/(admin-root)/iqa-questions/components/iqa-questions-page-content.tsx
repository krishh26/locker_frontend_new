"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { IQAQuestionsDataTable } from "./iqa-questions-data-table";

const questionTypeOptions = [
  "All",
  "Observe Assessor",
  "Learner Interview",
  "Employer Interview",
  "Final Check",
];

export function IQAQuestionsPageContent() {
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>("");

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="IQA Maintain Questions"
        subtitle="Manage and organize IQA assessment questions by type"
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