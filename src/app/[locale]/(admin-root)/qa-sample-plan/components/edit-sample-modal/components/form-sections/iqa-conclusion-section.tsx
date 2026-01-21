import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import type { ModalFormData } from '../../types'
import { iqaConclusionOptions } from '../../../../utils/constants'

interface IqaConclusionSectionProps {
  modalFormData: ModalFormData
  onIqaConclusionToggle: (option: string) => void
  isReadOnly?: boolean
}

export function IqaConclusionSection({
  modalFormData,
  onIqaConclusionToggle,
  isReadOnly = false,
}: IqaConclusionSectionProps) {
  return (
    <div className='md:col-span-4 space-y-2'>
      <Label className='text-sm font-semibold'>IQA Conclusion</Label>
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-wrap gap-2'>
            {iqaConclusionOptions.map((option: string) => (
              <div key={option} className='flex items-center space-x-2'>
                <Checkbox
                  id={`iqa-${option}`}
                  checked={modalFormData.iqaConclusion.includes(option)}
                  onCheckedChange={() => onIqaConclusionToggle(option)}
                  disabled={isReadOnly}
                />
                <Label htmlFor={`iqa-${option}`} className='text-sm cursor-pointer'>
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

