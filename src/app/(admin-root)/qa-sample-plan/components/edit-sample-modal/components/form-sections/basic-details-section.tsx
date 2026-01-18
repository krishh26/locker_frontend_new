import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
}

export function BasicDetailsSection({
  modalFormData,
  onFormDataChange,
}: BasicDetailsSectionProps) {
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
          <Label>QA Name</Label>
          <Input value={modalFormData.qaName || ''} disabled />
        </div>
      </div>
      <div className='md:col-span-4 space-y-4'>
        <div className='space-y-2'>
          <Label>Type</Label>
          <Select value={modalFormData.type || undefined} onValueChange={handleTypeChange}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Formative'>Formative</SelectItem>
              <SelectItem value='Summative'>Summative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='md:col-span-4 space-y-4'>
        <div className='space-y-2'>
          <Label>Sample Type</Label>
          <Select
            value={modalFormData.sampleType || undefined}
            onValueChange={handleSampleTypeChange}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select sample type' />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: 'Portfolio', label: 'Sample Portfolio' },
                { value: 'ObserveAssessor', label: 'Observe Assessor' },
                { value: 'LearnerInterview', label: 'Learner Interview' },
                { value: 'EmployerInterview', label: 'Employer Interview' },
                { value: 'Final', label: 'Final Check' },
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
        <Label>Planned Date</Label>
        <Input
          type='date'
          value={formatDateForInput(modalFormData.plannedDate)}
          onChange={(e) => onFormDataChange('plannedDate', e.target.value)}
        />
      </div>
      <div className='md:col-span-6 space-y-2'>
        <Label>Completed Date</Label>
        <Input
          type='date'
          value={formatDateForInput(modalFormData.completedDate)}
          onChange={(e) => onFormDataChange('completedDate', e.target.value)}
        />
      </div>
    </>
  )
}

