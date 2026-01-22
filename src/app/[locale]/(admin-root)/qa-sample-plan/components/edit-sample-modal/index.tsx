'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { SampleAction } from '@/store/api/qa-sample-plan/types'
import type { EditSampleModalProps } from './types'
import { useSampleActions } from './hooks/use-sample-actions'
import { useSampleForms } from './hooks/use-sample-forms'
import { useSampleDocuments } from './hooks/use-sample-documents'
import { useEvidenceList } from './hooks/use-evidence-list'
import { ModalHeader } from './components/modal-header'
import { ModalTabs } from './components/modal-tabs'
import { ActionButtonsBar } from './components/action-buttons-bar'
import { BasicDetailsSection } from './components/form-sections/basic-details-section'
import { AssessmentMethodsSection } from './components/form-sections/assessment-methods-section'
import { IqaConclusionSection } from './components/form-sections/iqa-conclusion-section'
import { AssessorDecisionSection } from './components/form-sections/assessor-decision-section'
import { AssessmentProcessesSection } from './components/form-sections/assessment-processes-section'
import { FeedbackSection } from './components/form-sections/feedback-section'
import { EvidenceLinksTable } from './components/tables/evidence-links-table'
import { ActionsTable } from './components/tables/actions-table'
import { IqaQuestionsSection } from './components/iqa-questions/iqa-questions-section'
import { DeleteActionDialog } from './components/dialogs/delete-action-dialog'
import { DeleteDocumentDialog } from './components/dialogs/delete-document-dialog'
import { DeleteFormDialog } from './components/dialogs/delete-form-dialog'
import { DeleteLearnerDialog } from './components/dialogs/delete-learner-dialog'
import { ActionFormData, ActionModal } from '../action-modal'

export function EditSampleModal({
  open,
  onClose,
  activeTab,
  onTabChange,
  modalFormData,
  onFormDataChange,
  onAssessmentMethodToggle,
  onIqaConclusionToggle,
  sampleQuestions,
  onAnswerChange,
  onDeleteQuestion,
  onSaveQuestions,
  plannedDates = [],
  onSave,
  isSaving = false,
  planDetailId = null,
  unitCode = null,
  unitName = null,
  unitType = null,
  onCreateNew,
  isCreating = false,
  onDelete,
}: EditSampleModalProps) {
  const user = useAppSelector((state) => state.auth.user)
  const iqaId = user?.user_id
  const userRole = user?.role
  const isEQA = userRole === 'EQA' || userRole === 'eqa'

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<SampleAction | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

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
  } = useSampleActions(planDetailId, String(iqaId) as string | number | null)

  const {
    deleteFormId,
    setDeleteFormId,
    isUnlinkingForm,
    fetchAllocatedForms,
    handleDeleteAllocatedForm,
  } = useSampleForms(planDetailId, String(iqaId) as string | number | null)

  const {
    deleteDocumentId,
    setDeleteDocumentId,
    isDeletingDocument,
    fetchDocuments,
    handleDeleteDocument,
  } = useSampleDocuments(planDetailId)

  const { evidenceList, isLoadingEvidence, fetchEvidence } = useEvidenceList(
    planDetailId,
    unitCode
  )

  // Fetch data when modal opens
  useEffect(() => {
    if (open && planDetailId) {
      fetchActions()
      fetchAllocatedForms()
      fetchDocuments()
      if (unitCode) {
        fetchEvidence()
      }
    }
  }, [open, planDetailId, unitCode, fetchActions, fetchAllocatedForms, fetchDocuments, fetchEvidence])

  // Action modal handlers
  const handleOpenActionModal = () => {
    setEditingAction(null)
    setActionModalOpen(true)
  }

  const handleCloseActionModal = () => {
    setActionModalOpen(false)
    setEditingAction(null)
  }

  const handleEditAction = (action: SampleAction) => {
    setEditingAction(action)
    setActionModalOpen(true)
  }

  const handleSaveAction = async (formData: ActionFormData) => {
    const success = await saveAction(formData, editingAction)
    if (success) {
      handleCloseActionModal()
    }
  }

  const handleDeleteLearner = async () => {
    setShowDeleteConfirmation(false)
    if (onDelete) {
      onDelete()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-7xl! max-h-[90vh] overflow-hidden flex flex-col p-0'>
        <ModalHeader />

        <ModalTabs
          plannedDates={plannedDates}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onCreateNew={onCreateNew}
          isCreating={isCreating}
          isReadOnly={isEQA}
        />

        <ActionButtonsBar
          planDetailId={planDetailId}
          isSaving={isSaving}
          onClose={onClose}
          onDelete={() => setShowDeleteConfirmation(true)}
          onSave={onSave}
          isReadOnly={isEQA}
        />

        {/* Content */}
        <div className='flex-1 overflow-auto p-6'>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
            <BasicDetailsSection
              modalFormData={modalFormData}
              onFormDataChange={onFormDataChange}
              isReadOnly={isEQA}
            />
            <AssessmentMethodsSection
              modalFormData={modalFormData}
              onAssessmentMethodToggle={onAssessmentMethodToggle}
              isReadOnly={isEQA}
            />
            <IqaConclusionSection
              modalFormData={modalFormData}
              onIqaConclusionToggle={onIqaConclusionToggle}
              isReadOnly={isEQA}
            />
            <AssessorDecisionSection
              modalFormData={modalFormData}
              onFormDataChange={onFormDataChange}
              isReadOnly={isEQA}
            />
            <AssessmentProcessesSection
              modalFormData={modalFormData}
              onFormDataChange={onFormDataChange}
              isReadOnly={isEQA}
            />
            <FeedbackSection
              modalFormData={modalFormData}
              planDetailId={planDetailId}
              unitCode={unitCode}
              unitName={unitName}
              unitType={unitType}
              onFormDataChange={onFormDataChange}
              isReadOnly={isEQA}
            />
          </div>

          <div className='flex mt-6 gap-4 justify-between'>
            <EvidenceLinksTable
              evidenceList={evidenceList}
              isLoadingEvidence={isLoadingEvidence}
              unitCode={unitCode}
              onRefresh={fetchEvidence}
              isReadOnly={isEQA}
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
              isReadOnly={isEQA}
            />
          </div>

          <IqaQuestionsSection
            sampleQuestions={sampleQuestions}
            onAnswerChange={onAnswerChange}
            onDeleteQuestion={onDeleteQuestion}
            onSaveQuestions={onSaveQuestions}
            isReadOnly={isEQA}
          />
        </div>
      </DialogContent>

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

      <DeleteLearnerDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleDeleteLearner}
      />
    </Dialog>
  )
}

