'use client'

import { useAppSelector } from '@/store/hooks'
import { selectEditSampleModal } from '@/store/slices/qaSamplePlanSlice'
import { EditSampleModal } from './edit-sample-modal'
import { useEditSampleModal } from './edit-sample-modal/hooks/use-edit-sample-modal'
import { useLearnersData } from './qa-sample-plan-page-content/hooks/use-learners-data'
import {
  selectFilterState,
  selectSelectedPlan,
} from '@/store/slices/qaSamplePlanSlice'
import { Loader2 } from 'lucide-react'

export function EditSampleModalWrapper() {
  const modalState = useAppSelector(selectEditSampleModal)
  const filterState = useAppSelector(selectFilterState)
  const selectedPlan = useAppSelector(selectSelectedPlan)

  // Get learners data hook for refresh after delete (must be called unconditionally)
  const learnersData = useLearnersData(
    selectedPlan,
    filterState.filterApplied,
    filterState.searchText
  )

  // Use the custom hook for modal state management (must be called unconditionally)
  const {
    modalFormData,
    activeTab,
    sampleQuestions,
    plannedDates,
    isSaving,
    isCreating,
    isLoading,
    handleFormDataChange,
    handleAssessmentMethodToggle,
    handleIqaConclusionToggle,
    handleQuestionChange,
    handleAnswerChange,
    handleAddQuestion,
    handleDeleteQuestion,
    handleSaveQuestions,
    handleSave,
    handleDelete,
    handleClose,
    handleTabChange,
    handleCreateNew,
  } = useEditSampleModal(
    selectedPlan,
    modalState.currentPlanDetailId,
    modalState.editSampleModalOpen,
    () => {
      // Refresh learners data after delete
      if (selectedPlan) {
        learnersData.triggerSamplePlanLearners(selectedPlan)
      }
    }
  )

  // Only conditionally render the modal, but hooks are always called
  if (!modalState.editSampleModalOpen) {
    return null
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-full'>
        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
        Loading...
      </div>
    )
  }

  return (
    <EditSampleModal
      open={modalState.editSampleModalOpen}
      onClose={handleClose}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      modalFormData={modalFormData}
      onFormDataChange={handleFormDataChange}
      onAssessmentMethodToggle={handleAssessmentMethodToggle}
      onIqaConclusionToggle={handleIqaConclusionToggle}
      sampleQuestions={sampleQuestions}
      onQuestionChange={handleQuestionChange}
      onAnswerChange={handleAnswerChange}
      onAddQuestion={handleAddQuestion}
      onDeleteQuestion={handleDeleteQuestion}
      onSaveQuestions={handleSaveQuestions}
      plannedDates={plannedDates}
      onSave={handleSave}
      isSaving={isSaving}
      planDetailId={modalState.currentPlanDetailId}
      unitCode={modalState.currentUnitCode}
      unitName={modalState.currentUnitName}
      unitType={modalState.currentUnitType}
      onCreateNew={handleCreateNew}
      isCreating={isCreating}
      onDelete={handleDelete}
      onDeleteSuccess={() => {
        if (selectedPlan) {
          learnersData.triggerSamplePlanLearners(selectedPlan)
        }
      }}
    />
  )
}
