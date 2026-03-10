import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTranslations } from 'next-intl'
import type { ModalFormData } from '../../types'

interface AssessorDecisionSectionProps {
  modalFormData: ModalFormData
  onFormDataChange: (field: string, value: unknown) => void
  isReadOnly?: boolean
}

export function AssessorDecisionSection({
  modalFormData,
  onFormDataChange,
  isReadOnly = false,
}: AssessorDecisionSectionProps) {
  const t = useTranslations('qaSamplePlan.editSampleModal.formSections.assessorDecision')
  return (
    <div className='md:col-span-4 space-y-2'>
      <Label className='text-sm font-semibold'>{t('title')}</Label>
      <RadioGroup
        value={modalFormData.assessorDecisionCorrect}
        onValueChange={(value) => onFormDataChange('assessorDecisionCorrect', value)}
        className='flex flex-row gap-4'
        disabled={isReadOnly}
      >
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='Yes' id='decision-yes' disabled={isReadOnly} />
          <Label htmlFor='decision-yes' className={isReadOnly ? '' : 'cursor-pointer'}>
            {t('yes')}
          </Label>
        </div>
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='No' id='decision-no' disabled={isReadOnly} />
          <Label htmlFor='decision-no' className={isReadOnly ? '' : 'cursor-pointer'}>
            {t('no')}
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

