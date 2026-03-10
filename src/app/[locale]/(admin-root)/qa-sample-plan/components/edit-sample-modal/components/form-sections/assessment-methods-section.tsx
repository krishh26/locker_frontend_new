import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import type { ModalFormData } from '../../types'
import { assessmentMethods } from '../../../../utils/constants'

interface AssessmentMethodsSectionProps {
  modalFormData: ModalFormData
  onAssessmentMethodToggle: (code: string) => void
  isReadOnly?: boolean
}

export function AssessmentMethodsSection({
  modalFormData,
  onAssessmentMethodToggle,
  isReadOnly = false,
}: AssessmentMethodsSectionProps) {
  const t = useTranslations('qaSamplePlan.editSampleModal.formSections.assessmentMethods')
  return (
    <div className='md:col-span-4 space-y-2'>
      <Label className='text-sm font-semibold'>{t('title')}</Label>
      <Card>
        <CardContent className='p-4'>
          <div className='grid grid-cols-3 gap-2'>
            {assessmentMethods.map((method: { code: string; title: string }) => (
              <div key={method.code} className='flex items-center space-x-2'>
                <Checkbox
                  id={`method-${method.code}`}
                  checked={modalFormData.assessmentMethods.includes(method.code)}
                  onCheckedChange={() => onAssessmentMethodToggle(method.code)}
                  disabled={isReadOnly}
                />
                <Label htmlFor={`method-${method.code}`} className='text-sm cursor-pointer'>
                  {method.code}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

