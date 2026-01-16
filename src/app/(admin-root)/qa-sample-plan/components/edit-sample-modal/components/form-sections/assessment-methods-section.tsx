import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import type { ModalFormData } from '../../types'
import { assessmentMethods } from '../../../constants'

interface AssessmentMethodsSectionProps {
  modalFormData: ModalFormData
  onAssessmentMethodToggle: (code: string) => void
}

export function AssessmentMethodsSection({
  modalFormData,
  onAssessmentMethodToggle,
}: AssessmentMethodsSectionProps) {
  return (
    <div className='md:col-span-4 space-y-2'>
      <Label className='text-sm font-semibold'>Assessment Methods</Label>
      <Card>
        <CardContent className='p-4'>
          <div className='grid grid-cols-3 gap-2'>
            {assessmentMethods.map((method: { code: string; title: string }) => (
              <div key={method.code} className='flex items-center space-x-2'>
                <Checkbox
                  id={`method-${method.code}`}
                  checked={modalFormData.assessmentMethods.includes(method.code)}
                  onCheckedChange={() => onAssessmentMethodToggle(method.code)}
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

