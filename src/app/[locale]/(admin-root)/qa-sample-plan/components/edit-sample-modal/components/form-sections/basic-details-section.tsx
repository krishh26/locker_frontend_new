import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateForInput } from '../../../../utils/constants'
import type { ModalFormData } from '../../types'

interface BasicDetailsSectionProps {
  modalFormData: ModalFormData
  onFormDataChange: (field: string, value: unknown) => void
  isReadOnly?: boolean
}

export function BasicDetailsSection({
  modalFormData,
  onFormDataChange,
  isReadOnly = false,
}: BasicDetailsSectionProps) {
  const t = useTranslations('qaSamplePlan.editSampleModal.formSections.basicDetails')
  const handleTypeChange = useCallback(
    (value: string) => {
      const currentValue = modalFormData.type || undefined
      if (value !== currentValue) {
        onFormDataChange('type', value)
      }
    },
    [modalFormData.type, onFormDataChange]
  )

  const handleSampleTypeChange = useCallback(
    (value: string) => {
      const currentValue = modalFormData.sampleType || undefined
      if (value !== currentValue) {
        onFormDataChange('sampleType', value)
      }
    },
    [modalFormData.sampleType, onFormDataChange]
  )

  return (
    <>
      <div className='md:col-span-4 space-y-4'>
        <div className='space-y-2'>
          <Label>{t('qaName')}</Label>
          <Input value={modalFormData.qaName || ''} disabled />
        </div>
      </div>
      <div className='md:col-span-4 space-y-4'>
        <div className='space-y-2'>
          <Label>{t('type')}</Label>
          <Select 
            value={modalFormData.type || undefined} 
            onValueChange={handleTypeChange}
            disabled={isReadOnly}
          >
            <SelectTrigger className='w-full' disabled={isReadOnly}>
              <SelectValue placeholder={t('selectType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Formative'>{t('types.formative')}</SelectItem>
              <SelectItem value='Summative'>{t('types.summative')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='md:col-span-4 space-y-4'>
        <div className='space-y-2'>
          <Label>{t('sampleType')}</Label>
          <Select
            value={modalFormData.sampleType || undefined}
            onValueChange={handleSampleTypeChange}
            disabled={isReadOnly}
          >
            <SelectTrigger className='w-full' disabled={isReadOnly}>
              <SelectValue placeholder={t('selectSampleType')} />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: 'Portfolio', label: t('sampleTypes.portfolio') },
                { value: 'ObserveAssessor', label: t('sampleTypes.observeAssessor') },
                { value: 'LearnerInterview', label: t('sampleTypes.learnerInterview') },
                { value: 'EmployerInterview', label: t('sampleTypes.employerInterview') },
                { value: 'Final', label: t('sampleTypes.final') },
              ].map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='md:col-span-6 space-y-2'>
        <Label>{t('plannedDate')}</Label>
        <Input
          type='date'
          value={formatDateForInput(modalFormData.plannedDate)}
          onChange={(e) => onFormDataChange('plannedDate', e.target.value)}
          disabled={isReadOnly}
          readOnly={isReadOnly}
        />
      </div>
      <div className='md:col-span-6 space-y-2'>
        <Label>{t('completedDate')}</Label>
        <Input
          type='date'
          value={formatDateForInput(modalFormData.completedDate)}
          onChange={(e) => onFormDataChange('completedDate', e.target.value)}
          disabled={isReadOnly}
          readOnly={isReadOnly}
        />
      </div>
    </>
  )
}

