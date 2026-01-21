import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ModalFormData } from '../../types'

interface AssessmentProcessesSectionProps {
  modalFormData: ModalFormData
  onFormDataChange: (field: string, value: unknown) => void
  isReadOnly?: boolean
}

export function AssessmentProcessesSection({
  modalFormData,
  onFormDataChange,
  isReadOnly = false,
}: AssessmentProcessesSectionProps) {
  return (
    <div className='col-span-12 space-y-2'>
      <Label>Assessment Processes</Label>
      <Textarea
        rows={4}
        value={modalFormData.assessmentProcesses}
        onChange={(e) => onFormDataChange('assessmentProcesses', e.target.value)}
        disabled={isReadOnly}
        readOnly={isReadOnly}
      />
    </div>
  )
}

