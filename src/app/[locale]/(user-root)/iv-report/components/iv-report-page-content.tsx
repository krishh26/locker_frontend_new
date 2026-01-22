"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { IVReportForm } from "./iv-report-form";
import { UnitTabs } from "./unit-tabs";
import { InlineEditSampleContent } from "./inline-edit-sample-content";
import { useIVReportData} from "../hooks/use-iv-report-data";
import { useEditSampleState } from "../hooks/use-edit-sample-state";

export function IVReportPageContent() {
  const searchParams = useSearchParams();
  const courseIdFromUrl = searchParams.get("course_id");

  // State for unit selection and tabs - using indices instead of objects
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Fetch learners and units data
  const { units, planId, isLoading, isError, error } = useIVReportData(courseIdFromUrl);

  // Derive selected unit from index
  const selectedUnit = units.length > 0 && selectedUnitIndex >= 0 && selectedUnitIndex < units.length
    ? units[selectedUnitIndex]
    : null;

  // Get current sample_history item
  const currentSampleHistory = selectedUnit?.sample_history?.[activeTabIndex] || null;
  const planDetailId = currentSampleHistory?.detail_id || null;

  // Reset to first unit and first tab when units change
  useEffect(() => {
    if (units.length > 0 && (selectedUnitIndex >= units.length || selectedUnitIndex < 0)) {
      setSelectedUnitIndex(0);
      setActiveTabIndex(0);
    }
  }, [units, selectedUnitIndex]);

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

  const handleUnitSelect = (unitIndex: number) => {
    setSelectedUnitIndex(unitIndex);
    setActiveTabIndex(0); // Auto-select first sample history tab
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
        showBackButton
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
        ) : units.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No units found for this course.</p>
          </div>
        ) : (
          <>
            {/* Unit Tabs with nested sample history tabs */}
            <UnitTabs
              units={units}
              selectedUnitIndex={selectedUnitIndex}
              activeTabIndex={activeTabIndex}
              onUnitSelect={handleUnitSelect}
              onTabChange={handleTabChange}
            />

            {/* Inline Edit Sample Content */}
            {selectedUnit && currentDetailId && (
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
        )}
      </div>
    </div>
  );
}
