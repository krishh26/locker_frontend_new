import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SampleAction } from '@/store/api/qa-sample-plan/types'
import {
  useLazyGetSampleActionsQuery,
  useCreateSampleActionMutation,
  useUpdateSampleActionMutation,
  useDeleteSampleActionMutation,
} from '@/store/api/qa-sample-plan/qaSamplePlanApi'
import type { ActionFormData } from '../../action-modal'

export function useSampleActions(planDetailId: string | number | null, iqaId: string | number | null) {
  const [actions, setActions] = useState<SampleAction[]>([])
  const [deleteActionId, setDeleteActionId] = useState<number | null>(null)

  const [triggerGetActions, { isLoading: isLoadingActions }] = useLazyGetSampleActionsQuery()
  const [createAction, { isLoading: isCreatingAction }] = useCreateSampleActionMutation()
  const [updateAction, { isLoading: isUpdatingAction }] = useUpdateSampleActionMutation()
  const [deleteAction, { isLoading: isDeletingAction }] = useDeleteSampleActionMutation()

  const fetchActions = useCallback(async () => {
    if (!planDetailId) return
    try {
      const response = await triggerGetActions(planDetailId).unwrap()
      setActions((response as { data?: SampleAction[] })?.data || [])
    } catch (error) {
      console.error('Error fetching actions:', error)
      setActions([])
    }
  }, [planDetailId, triggerGetActions])

  const handleSaveAction = useCallback(
    async (formData: ActionFormData, editingAction: SampleAction | null) => {
      if (!planDetailId || !iqaId) {
        toast.error('Missing required information')
        return
      }

      try {
        if (editingAction) {
          await updateAction({
            actionId: editingAction.id,
            action_required: formData.action_required,
            target_date: formData.target_date,
            status: formData.status,
            assessor_feedback: formData.assessor_feedback || undefined,
            action_with_id: formData.action_with_id,
          }).unwrap()
          toast.success('Action updated successfully')
        } else {
          await createAction({
            plan_detail_id: planDetailId,
            action_with_id: formData.action_with_id,
            action_required: formData.action_required,
            target_date: formData.target_date,
            status: formData.status,
            created_by_id: iqaId,
            assessor_feedback: formData.assessor_feedback || undefined,
          }).unwrap()
          toast.success('Action created successfully')
        }
        fetchActions()
        return true
      } catch (error: unknown) {
        const message =
          (error as { data?: { message?: string }; error?: string })?.data?.message ||
          (error as { error?: string })?.error ||
          'Failed to save action'
        toast.error(message)
        return false
      }
    },
    [planDetailId, iqaId, createAction, updateAction, fetchActions]
  )

  const handleDeleteAction = useCallback(
    async (actionId: number) => {
      try {
        await deleteAction(actionId).unwrap()
        toast.success('Action deleted successfully')
        fetchActions()
        setDeleteActionId(null)
      } catch (error: unknown) {
        const message =
          (error as { data?: { message?: string }; error?: string })?.data?.message ||
          (error as { error?: string })?.error ||
          'Failed to delete action'
        toast.error(message)
        setDeleteActionId(null)
      }
    },
    [deleteAction, fetchActions]
  )

  return {
    actions,
    isLoadingActions,
    isCreatingAction,
    isUpdatingAction,
    isDeletingAction,
    deleteActionId,
    setDeleteActionId,
    fetchActions,
    handleSaveAction,
    handleDeleteAction,
  }
}

