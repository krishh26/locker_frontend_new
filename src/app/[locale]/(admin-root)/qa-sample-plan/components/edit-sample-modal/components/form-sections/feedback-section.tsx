import { useRouter } from "@/i18n/navigation"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import type { ModalFormData } from '../../types'

interface FeedbackSectionProps {
  modalFormData: ModalFormData
  planDetailId: string | number | null
  unitCode: string | null
  unitName: string | null
  unitType: string | null
  onFormDataChange: (field: string, value: unknown) => void
  isReadOnly?: boolean
}

export function FeedbackSection({
  modalFormData,
  planDetailId,
  unitCode,
  unitName,
  unitType,
  onFormDataChange,
  isReadOnly = false,
}: FeedbackSectionProps) {
  const router = useRouter()
  const t = useTranslations('qaSamplePlan.editSampleModal.formSections.feedback')

  return (
    <>
      <div className='col-span-12 space-y-2'>
        <Label>{t('title')}</Label>
        <Textarea
          rows={6}
          value={modalFormData.feedback}
          onChange={(e) => onFormDataChange('feedback', e.target.value)}
          placeholder={t('placeholder')}
          maxLength={4400}
          disabled={isReadOnly}
          readOnly={isReadOnly}
        />
      </div>

      <div className='col-span-12 mt-2 flex justify-end'>
        <Button
          type='button'
          onClick={() => {
            if (planDetailId) {
              const params = new URLSearchParams()
              if (unitCode) params.set('unit_code', String(unitCode))
              if (unitName) params.set('unitName', unitName)
              if (unitType) params.set('unitType', unitType)
              router.push(`/qa-sample-plan/${planDetailId}/evidence?${params.toString()}`)
            }
          }}
          disabled={!planDetailId || isReadOnly}
          className='bg-destructive hover:bg-destructive/90 text-white'
        >
          Examine Evidence
        </Button>
      </div>
    </>
  )
}

