import type { SampleQuestion } from '@/store/api/qa-sample-plan/types'

export interface ModalFormData {
  qaName: string
  plannedDate: string
  assessmentMethods: string[]
  assessmentProcesses: string
  feedback: string
  type: string
  completedDate: string
  sampleType: string
  iqaConclusion: string[]
  assessorDecisionCorrect: string
}

export interface EditSampleModalProps {
  open: boolean
  onClose: () => void
  activeTab: number
  onTabChange: (value: number) => void
  modalFormData: ModalFormData
  onFormDataChange: (field: string, value: unknown) => void
  onAssessmentMethodToggle: (code: string) => void
  onIqaConclusionToggle: (option: string) => void
  sampleQuestions: SampleQuestion[]
  onQuestionChange: (id: string, question: string) => void
  onAnswerChange: (id: string, answer: 'Yes' | 'No') => void
  onAddQuestion: () => void
  onDeleteQuestion: (id: string) => void
  onSaveQuestions: () => void
  plannedDates?: string[]
  onSave?: () => void
  isSaving?: boolean
  planDetailId?: string | number | null
  unitCode?: string | null
  unitName?: string | null
  unitType?: string | null
  onCreateNew?: () => void
  isCreating?: boolean
  onDeleteSuccess?: () => void
  onDelete?: () => void
}

