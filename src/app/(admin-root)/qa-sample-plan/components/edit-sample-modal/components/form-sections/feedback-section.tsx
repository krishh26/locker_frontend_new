import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { ModalFormData } from '../../types'

interface FeedbackSectionProps {
  modalFormData: ModalFormData
  planDetailId: string | number | null
  unitCode: string | null
  unitName: string | null
  unitType: string | null
  onFormDataChange: (field: string, value: unknown) => void
}

export function FeedbackSection({
  modalFormData,
  planDetailId,
  unitCode,
  unitName,
  unitType,
  onFormDataChange,
}: FeedbackSectionProps) {
  const router = useRouter()

  return (
    <>
      <div className='col-span-12 space-y-2'>
        <Label>Feedback</Label>
        <Textarea
          rows={6}
          value={modalFormData.feedback}
          onChange={(e) => onFormDataChange('feedback', e.target.value)}
          placeholder='Please type in feedback. Max 4400 characters.'
          maxLength={4400}
        />
      </div>

      <div className='col-span-12 mt-4'>
        <Button
          onClick={() => {
            // Navigate to examine evidence page with searchParams
            if (planDetailId) {
              const params = new URLSearchParams()
              if (unitCode) params.set('unit_code', String(unitCode))
              if (unitName) params.set('unitName', unitName)
              if (unitType) params.set('unitType', unitType)
              router.push(`/qa-sample-plan/${planDetailId}/evidence?${params.toString()}`)
            }
          }}
          disabled={!planDetailId}
          className='bg-[#e91e63] hover:bg-[#c2185b] text-white'
        >
          Examine Evidence
        </Button>
      </div>
    </>
  )
}

