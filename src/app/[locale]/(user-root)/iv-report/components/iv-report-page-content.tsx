"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { IVReportForm } from "./iv-report-form";
import { UnitCards } from "./unit-cards";
import { UnitTabs } from "./unit-tabs";
import { InlineEditSampleContent } from "./inline-edit-sample-content";
import { useIVReportData, type UnitWithHistory } from "../hooks/use-iv-report-data";
import { useEditSampleState } from "../hooks/use-edit-sample-state";

export function IVReportPageContent() {
  const searchParams = useSearchParams();
  const courseIdFromUrl = searchParams.get("course_id");

  // State for unit selection and tabs
  const [selectedUnit, setSelectedUnit] = useState<UnitWithHistory | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Fetch learners and units data
  const { units, planId, isLoading, isError, error } = useIVReportData(courseIdFromUrl);

  // Get current sample_history item
  const currentSampleHistory = selectedUnit?.sample_history?.[activeTabIndex] || null;
  const planDetailId = currentSampleHistory?.detail_id || null;

  // Edit Sample state management
  const {
    modalFormData,
    sampleQuestions,
    isSaving,
    handleFormDataChange,
    handleAssessmentMethodToggle,
    handleIqaConclusionToggle,
    handleAnswerChange,
    handleDeleteQuestion,
    handleSaveQuestions,
    handleSave,
    currentDetailId,
  } = useEditSampleState(planId, planDetailId, selectedUnit, activeTabIndex);

  const handleUnitSelect = (unit: UnitWithHistory) => {
    setSelectedUnit(unit);
    setActiveTabIndex(0);
  };

  const handleBackToUnits = () => {
    setSelectedUnit(null);
    setActiveTabIndex(0);
  };

  const handleTabChange = (newTabIndex: number) => {
    setActiveTabIndex(newTabIndex);
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="IV Report"
        subtitle="Complete the IV report form for learner units"
        icon={FileText}
      />

      {/* IV Report Form */}
      <div className="@container/main">
        <IVReportForm />
      </div>

      {/* Units Section */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading units...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-destructive">
              {error && typeof error === "object" && "message" in error
                ? String(error.message)
                : "Failed to load units. Please try again."}
            </p>
          </div>
        ) : selectedUnit ? (
          <>
            {/* Unit Tabs */}
            <UnitTabs
              unit={selectedUnit}
              activeTab={activeTabIndex}
              onTabChange={handleTabChange}
              onBack={handleBackToUnits}
            />

            {/* Inline Edit Sample Content */}
            {currentDetailId && (
              <InlineEditSampleContent
                planDetailId={currentDetailId}
                unitCode={selectedUnit.unit_code || null}
                unitName={selectedUnit.unit_name || null}
                unitType={selectedUnit.type || null}
                modalFormData={modalFormData}
                onFormDataChange={handleFormDataChange}
                onAssessmentMethodToggle={handleAssessmentMethodToggle}
                onIqaConclusionToggle={handleIqaConclusionToggle}
                sampleQuestions={sampleQuestions}
                onAnswerChange={handleAnswerChange}
                onDeleteQuestion={handleDeleteQuestion}
                onSaveQuestions={handleSaveQuestions}
                onSave={handleSave}
                isSaving={isSaving}
              />
            )}
          </>
        ) : (
          /* Unit Cards */
          <UnitCards units={units} onUnitSelect={handleUnitSelect} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
