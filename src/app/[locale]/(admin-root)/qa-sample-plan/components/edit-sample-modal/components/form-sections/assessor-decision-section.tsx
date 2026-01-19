import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { ModalFormData } from '../../types'

interface AssessorDecisionSectionProps {
  modalFormData: ModalFormData
  onFormDataChange: (field: string, value: unknown) => void
}

export function AssessorDecisionSection({
  modalFormData,
  onFormDataChange,
}: AssessorDecisionSectionProps) {
  return (
    <div className='md:col-span-4 space-y-2'>
      <Label className='text-sm font-semibold'>Assessor Decision Correct</Label>
      <RadioGroup
        value={modalFormData.assessorDecisionCorrect}
        onValueChange={(value) => onFormDataChange('assessorDecisionCorrect', value)}
        className='flex flex-row gap-4'
      >
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='Yes' id='decision-yes' />
          <Label htmlFor='decision-yes' className='cursor-pointer'>
            Yes
          </Label>
        </div>
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='No' id='decision-no' />
          <Label htmlFor='decision-no' className='cursor-pointer'>
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

