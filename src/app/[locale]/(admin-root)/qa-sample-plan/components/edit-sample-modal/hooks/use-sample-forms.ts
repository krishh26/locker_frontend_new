import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from "next-intl";
import type { SampleAllocatedForm } from '@/store/api/qa-sample-plan/types'
import {
  useLazyGetSampleFormsQuery,
  useCreateSampleFormMutation,
  useDeleteSampleFormMutation,
  useCompleteSampleFormMutation,
} from '@/store/api/qa-sample-plan/qaSamplePlanApi'

export function useSampleForms(planDetailId: string | number | null, iqaId: string | number | null) {
  const t = useTranslations("qaSamplePlan.editSampleModal.toast");
  const [allocatedForms, setAllocatedForms] = useState<SampleAllocatedForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [deleteFormId, setDeleteFormId] = useState<number | null>(null)

  const [triggerGetForms] = useLazyGetSampleFormsQuery()
  const [createSampleForm] = useCreateSampleFormMutation()
  const [deleteSampleForm, { isLoading: isUnlinkingForm }] = useDeleteSampleFormMutation()
  const [completeSampleForm] = useCompleteSampleFormMutation()

  const fetchAllocatedForms = useCallback(async () => {
    if (!planDetailId) return
    try {
      const res = await triggerGetForms(planDetailId).unwrap()
      setAllocatedForms((res as { data?: SampleAllocatedForm[] })?.data || [])
    } catch {
      setAllocatedForms([])
    }
  }, [planDetailId, triggerGetForms])

  const handleAllocateForm = useCallback(async () => {
    if (!planDetailId || !iqaId || !selectedFormId) {
      toast.error(t("selectFormToAllocate"))
      return
    }
    try {
      await createSampleForm({
        plan_detail_id: planDetailId,
        form_id: selectedFormId,
        allocated_by_id: iqaId,
        description: formDescription || undefined,
      }).unwrap()
      toast.success(t("surveyAllocatedSuccess"))
      setFormDescription('')
      setSelectedFormId('')
      fetchAllocatedForms()
    } catch (error: unknown) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message || t("allocateSurveyFailed")
      )
    }
  }, [planDetailId, iqaId, selectedFormId, formDescription, createSampleForm, fetchAllocatedForms, t])

  const handleDeleteAllocatedForm = useCallback(
    async (id: number) => {
      try {
        await deleteSampleForm(id).unwrap()
        toast.success(t("formUnlinkedSuccess"))
        fetchAllocatedForms()
        setDeleteFormId(null)
      } catch (error: unknown) {
        toast.error(
          (error as { data?: { message?: string } })?.data?.message || t("unlinkFormFailed")
        )
        setDeleteFormId(null)
      }
    },
    [deleteSampleForm, fetchAllocatedForms, t]
  )

  const handleCompleteForm = useCallback(
    async (id: number) => {
      try {
        await completeSampleForm(id).unwrap()
        toast.success(t("formMarkedCompletedSuccess"))
        fetchAllocatedForms()
      } catch (error: unknown) {
        toast.error(
          (error as { data?: { message?: string } })?.data?.message ||
            t("markCompletedFailed")
        )
      }
    },
    [completeSampleForm, fetchAllocatedForms, t]
  )

  return {
    allocatedForms,
    selectedFormId,
    setSelectedFormId,
    formDescription,
    setFormDescription,
    deleteFormId,
    setDeleteFormId,
    isUnlinkingForm,
    fetchAllocatedForms,
    handleAllocateForm,
    handleDeleteAllocatedForm,
    handleCompleteForm,
  }
}

