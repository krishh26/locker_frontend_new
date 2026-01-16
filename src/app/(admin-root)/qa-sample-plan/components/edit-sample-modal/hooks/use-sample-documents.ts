import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { SampleDocument } from '@/store/api/qa-sample-plan/types'
import {
  useLazyGetSampleDocumentsQuery,
  useUploadSampleDocumentMutation,
  useDeleteSampleDocumentMutation,
} from '@/store/api/qa-sample-plan/qaSamplePlanApi'

export function useSampleDocuments(planDetailId: string | number | null) {
  const [documents, setDocuments] = useState<SampleDocument[]>([])
  const [deleteDocumentId, setDeleteDocumentId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [triggerGetDocuments] = useLazyGetSampleDocumentsQuery()
  const [uploadDocument] = useUploadSampleDocumentMutation()
  const [deleteDocument, { isLoading: isDeletingDocument }] = useDeleteSampleDocumentMutation()

  const fetchDocuments = useCallback(async () => {
    if (!planDetailId) return
    try {
      const res = await triggerGetDocuments(planDetailId).unwrap()
      setDocuments((res as { data?: SampleDocument[] })?.data || [])
    } catch {
      setDocuments([])
    }
  }, [planDetailId, triggerGetDocuments])

  const handleUploadDocument = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !planDetailId) return

      const formData = new FormData()
      formData.append('file', file)
      formData.append('plan_detail_id', String(planDetailId))

      try {
        await uploadDocument(formData).unwrap()
        toast.success('Document uploaded successfully')
        fetchDocuments()
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (error: unknown) {
        toast.error(
          (error as { data?: { message?: string } })?.data?.message || 'Failed to upload document'
        )
      }
    },
    [planDetailId, uploadDocument, fetchDocuments]
  )

  const handleDeleteDocument = useCallback(
    async (docId: number) => {
      try {
        await deleteDocument(docId).unwrap()
        toast.success('Document deleted successfully')
        fetchDocuments()
        setDeleteDocumentId(null)
      } catch (error: unknown) {
        toast.error(
          (error as { data?: { message?: string } })?.data?.message || 'Failed to delete document'
        )
        setDeleteDocumentId(null)
      }
    },
    [deleteDocument, fetchDocuments]
  )

  return {
    documents,
    deleteDocumentId,
    setDeleteDocumentId,
    fileInputRef,
    isDeletingDocument,
    fetchDocuments,
    handleUploadDocument,
    handleDeleteDocument,
  }
}

