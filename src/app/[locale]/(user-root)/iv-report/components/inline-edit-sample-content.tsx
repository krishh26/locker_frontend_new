"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import type { SampleAction } from "@/store/api/qa-sample-plan/types";
import { useSampleActions } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/hooks/use-sample-actions";
import { useSampleForms } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/hooks/use-sample-forms";
import { useSampleDocuments } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/hooks/use-sample-documents";
import { useEvidenceList } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/hooks/use-evidence-list";
import { BasicDetailsSection } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/form-sections/basic-details-section";
import { AssessmentMethodsSection } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/form-sections/assessment-methods-section";
import { IqaConclusionSection } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/form-sections/iqa-conclusion-section";
import { AssessorDecisionSection } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/form-sections/assessor-decision-section";
import { AssessmentProcessesSection } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/form-sections/assessment-processes-section";
import { FeedbackSection } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/form-sections/feedback-section";
import { EvidenceLinksTable } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/tables/evidence-links-table";
import { ActionsTable } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/tables/actions-table";
import { IqaQuestionsSection } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/iqa-questions/iqa-questions-section";
import { ActionButtonsBar } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/action-buttons-bar";
import { DeleteActionDialog } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/dialogs/delete-action-dialog";
import { DeleteDocumentDialog } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/dialogs/delete-document-dialog";
import { DeleteFormDialog } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/components/dialogs/delete-form-dialog";
import { ActionFormData, ActionModal } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/action-modal";
import type { ModalFormData } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/types";
import type { SampleQuestion } from "@/store/api/qa-sample-plan/types";

interface InlineEditSampleContentProps {
  planDetailId: string | number | null;
  unitCode: string | number | null;
  unitName: string | null;
  unitType: string | null;
  modalFormData: ModalFormData;
  onFormDataChange: (field: string, value: unknown) => void;
  onAssessmentMethodToggle: (code: string) => void;
  onIqaConclusionToggle: (option: string) => void;
  sampleQuestions: SampleQuestion[];
  onAnswerChange: (id: string, answer: "Yes" | "No") => void;
  onDeleteQuestion: (id: string) => void;
  onSaveQuestions: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function InlineEditSampleContent({
  planDetailId,
  unitCode,
  unitName,
  unitType,
  modalFormData,
  onFormDataChange,
  onAssessmentMethodToggle,
  onIqaConclusionToggle,
  sampleQuestions,
  onAnswerChange,
  onDeleteQuestion,
  onSaveQuestions,
  onSave,
  isSaving = false,
}: InlineEditSampleContentProps) {
  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id;

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<SampleAction | null>(null);

  // Use focused hooks
  const {
    actions,
    isLoadingActions,
    isCreatingAction,
    isUpdatingAction,
    isDeletingAction,
    deleteActionId,
    setDeleteActionId,
    fetchActions,
    handleSaveAction: saveAction,
    handleDeleteAction: deleteAction,
  } = useSampleActions(planDetailId, String(iqaId) as string | number | null);

  const {
    deleteFormId,
    setDeleteFormId,
    isUnlinkingForm,
    fetchAllocatedForms,
    handleDeleteAllocatedForm,
  } = useSampleForms(planDetailId, String(iqaId) as string | number | null);

  const {
    deleteDocumentId,
    setDeleteDocumentId,
    isDeletingDocument,
    fetchDocuments,
    handleDeleteDocument,
  } = useSampleDocuments(planDetailId);

  const { evidenceList, isLoadingEvidence, fetchEvidence } = useEvidenceList(
    planDetailId,
    unitCode ? String(unitCode) : null
  );

  // Fetch data when component mounts or planDetailId changes
  useEffect(() => {
    if (planDetailId) {
      fetchActions();
      fetchAllocatedForms();
      fetchDocuments();
      if (unitCode) {
        fetchEvidence();
      }
    }
  }, [planDetailId, unitCode, fetchActions, fetchAllocatedForms, fetchDocuments, fetchEvidence]);

  // Action modal handlers
  const handleOpenActionModal = () => {
    setEditingAction(null);
    setActionModalOpen(true);
  };

  const handleCloseActionModal = () => {
    setActionModalOpen(false);
    setEditingAction(null);
  };

  const handleEditAction = (action: SampleAction) => {
    setEditingAction(action);
    setActionModalOpen(true);
  };

  const handleSaveAction = async (formData: ActionFormData) => {
    const success = await saveAction(formData, editingAction);
    if (success) {
      handleCloseActionModal();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ActionButtonsBar
        planDetailId={planDetailId}
        isSaving={isSaving}
        onClose={() => {}}
        onDelete={() => {}}
        onSave={onSave}
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <BasicDetailsSection
            modalFormData={modalFormData}
            onFormDataChange={onFormDataChange}
          />
          <AssessmentMethodsSection
            modalFormData={modalFormData}
            onAssessmentMethodToggle={onAssessmentMethodToggle}
          />
          <IqaConclusionSection
            modalFormData={modalFormData}
            onIqaConclusionToggle={onIqaConclusionToggle}
          />
          <AssessorDecisionSection
            modalFormData={modalFormData}
            onFormDataChange={onFormDataChange}
          />
          <AssessmentProcessesSection
            modalFormData={modalFormData}
            onFormDataChange={onFormDataChange}
          />
          <FeedbackSection
            modalFormData={modalFormData}
            planDetailId={planDetailId}
            unitCode={unitCode !== null && unitCode !== undefined ? String(unitCode) : null}
            unitName={unitName}
            unitType={unitType}
            onFormDataChange={onFormDataChange}
          />
        </div>

        <div className="flex mt-6 gap-4 justify-between flex-col md:flex-row">
          <EvidenceLinksTable
            evidenceList={evidenceList}
            isLoadingEvidence={isLoadingEvidence}
            unitCode={unitCode !== null && unitCode !== undefined ? String(unitCode) : null}
            onRefresh={fetchEvidence}
          />
          <ActionsTable
            actions={actions}
            isLoadingActions={isLoadingActions}
            isDeletingAction={isDeletingAction}
            deleteActionId={deleteActionId}
            planDetailId={planDetailId}
            onRefresh={fetchActions}
            onAddAction={handleOpenActionModal}
            onEditAction={handleEditAction}
            onDeleteAction={(id) => setDeleteActionId(id)}
          />
        </div>

        <IqaQuestionsSection
          sampleQuestions={sampleQuestions}
          onAnswerChange={onAnswerChange}
          onDeleteQuestion={onDeleteQuestion}
          onSaveQuestions={onSaveQuestions}
        />
      </div>

      {/* Action Modal */}
      <ActionModal
        open={actionModalOpen}
        onClose={handleCloseActionModal}
        onSave={handleSaveAction}
        editingAction={editingAction}
        isSaving={isCreatingAction || isUpdatingAction}
      />

      {/* Delete Dialogs */}
      <DeleteActionDialog
        open={deleteActionId !== null}
        isDeleting={isDeletingAction}
        onOpenChange={(open) => !open && setDeleteActionId(null)}
        onConfirm={() => deleteActionId && deleteAction(deleteActionId)}
      />

      <DeleteDocumentDialog
        open={deleteDocumentId !== null}
        isDeleting={isDeletingDocument}
        onOpenChange={(open) => !open && setDeleteDocumentId(null)}
        onConfirm={() => deleteDocumentId && handleDeleteDocument(deleteDocumentId)}
      />

      <DeleteFormDialog
        open={deleteFormId !== null}
        isUnlinking={isUnlinkingForm}
        onOpenChange={(open) => !open && setDeleteFormId(null)}
        onConfirm={() => deleteFormId && handleDeleteAllocatedForm(deleteFormId)}
      />
    </div>
  );
}
