/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useGetEvidenceDetailsQuery,
  useCreateEvidenceMutation,
  useUpdateEvidenceMutation,
  useUpsertAssignmentMappingMutation,
  useRequestSignatureMutation,
  useUploadExternalEvidenceFileMutation,
} from '@/store/api/evidence/evidenceApi'
import { useAppSelector } from '@/store/hooks'
import { selectCourses } from '@/store/slices/authSlice'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload, FileText } from 'lucide-react'
import { useRouter } from "@/i18n/navigation"
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQualificationHandlers } from '../../hooks/use-qualification-handlers'
import { reconstructFormStateFromMappings } from '../../utils/reconstruct-form-state'
import { COURSE_TYPES } from '../constants'
import { CourseSelection } from './course-selection'
import { getEvidenceFormSchema } from './evidence-form-schema'
import type { EvidenceFormValues } from './evidence-form-types'
import { FileUpload } from './file-upload'
import { QualificationHierarchyUnits } from './qualification-hierarchy-units'
import { SignatureTable } from './signature-table'
import { UnitsTable } from './units-table'
import { EvidenceUpdateRequest } from '@/store/api/evidence/types'
import { CreateDocumentCard } from './create-document-card'
import { ASSESSMENT_METHODS } from '@/utils/assessment-methods'
import { useGetLearnerPlanListQuery } from '@/store/api/learner-plan/learnerPlanApi'
import { formatSessionTime } from '@/utils/format-session-time'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EvidenceFormProps {
  evidenceId?: string
}

export function EvidenceForm({ evidenceId }: EvidenceFormProps) {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const courses = useAppSelector(selectCourses)
  const userRole = user?.role || 'Learner'
  const isEmployer = user?.role === "Employer";
  const isEditMode = !!evidenceId && !isEmployer

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileTab, setFileTab] = useState('upload')
  const [sessions, setSessions] = useState<Array<{ id: string | number; label: string }>>([])

  // Get learner ID - for learners, use their own ID; for trainers/admins, might need to get from context
  const learnerId = user?.learner_id ? String(user.learner_id) : null

  // Fetch learner plan list (sessions)
  const {
    data: learnerPlanData,
    error: learnerPlanError,
    isLoading: isLoadingLearnerPlan,
  } = useGetLearnerPlanListQuery(
    {
      learners: learnerId || '',
    },
    {
      skip: !learnerId || isEditMode, // Skip in edit mode or if no learner ID
    }
  )

  // Get evidence details if editing
  const { data: evidenceDetails, isLoading: isLoadingDetails } =
    useGetEvidenceDetailsQuery(Number(evidenceId), {
      skip: !evidenceId,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
    })

  const [createEvidence] = useCreateEvidenceMutation()
  const [updateEvidence] = useUpdateEvidenceMutation()
  const [upsertMapping] = useUpsertAssignmentMappingMutation()
  const [requestSignature] = useRequestSignatureMutation()
  const [uploadExternalEvidenceFile] = useUploadExternalEvidenceFileMutation()

  const schema = useMemo(
    () => getEvidenceFormSchema(userRole, isEditMode),
    [userRole, isEditMode]
  )

  const form = useForm<EvidenceFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: '',
      description: '',
      trainer_feedback: '',
      points_for_improvement: '',
      audio: null,
      file: null,
      learner_comments: '',
      evidence_time_log: false,
      session: '',
      grade: '',
      declaration: false,
      assessment_method: [],
      selectedCourses: [],
      courseSelectedTypes: {},
      units: [],
      signatures: [
        {
          role: 'Trainer',
          name: '',
          signed: false,
          es: '',
          date: '',
          signature_required: false,
        },
        {
          role: 'Learner',
          name: '',
          signed: false,
          es: '',
          date: '',
          signature_required: false,
        },
        {
          role: 'Employer',
          name: '',
          signed: false,
          es: '',
          date: '',
          signature_required: false,
        },
        {
          role: 'IQA',
          name: '',
          signed: false,
          es: '',
          date: '',
          signature_required: false,
        },
      ],
    },
  })

  console.log(form.formState.errors)

  // Process sessions data
  useEffect(() => {
    if (learnerPlanError) {
      setSessions([])
      return
    }

    if (learnerPlanData && learnerPlanData?.data && learnerPlanData.data.length > 0) {
      const payload = learnerPlanData.data.map((time) => {
        return {
          id: time.learner_plan_id,
          label: formatSessionTime(time.startDate, time.Duration),
        }
      })
      setSessions(payload)
    } else {
      setSessions([])
    }
  }, [learnerPlanData, learnerPlanError])

  // Load evidence data when editing
  useEffect(() => {
    if (evidenceDetails?.data && isEditMode) {
      const evidence = evidenceDetails.data
      // Parse assessment_method from string to array
      const assessmentMethodArray = evidence.assessment_method
        ? typeof evidence.assessment_method === 'string'
          ? evidence.assessment_method.split(',').map((m) => m.trim())
          : Array.isArray(evidence.assessment_method)
          ? evidence.assessment_method
          : []
        : []

      // Convert declaration from string to boolean
      const declarationValue =
        evidence.declaration === 'true' ||
        evidence.declaration === '1' ||
        String(evidence.declaration).toLowerCase() === 'true'
          ? true
          : false

      // Reconstruct form state from mappings (handles both Standard and Qualification courses)
      let reconstructedCourses: Array<{
        course_id: number
        course_name: string
        course_code: string
        course_core_type?: string
        units?: import('./evidence-form-types').StandardUnit[]
      }> = []
      let courseSelectedTypes: Record<string | number, string[]> = {}
      let reconstructedUnits: (
        | import('./evidence-form-types').StandardUnit
        | {
            id: string | number
            course_id?: string | number
            subUnit?: Array<{
              id?: string | number
              topics?: Array<{
                id?: string | number
                learnerMap?: boolean
                trainerMap?: boolean
                signedOff?: boolean
                comment?: string
              }>
            }>
          }
      )[] = []

      if (
        evidence.mappings &&
        evidence.mappings.length > 0 &&
        courses.length > 0
      ) {
        const reconstructed = reconstructFormStateFromMappings(
          evidence.mappings,
          courses
        )
        reconstructedCourses = reconstructed.selectedCourses
        courseSelectedTypes = reconstructed.courseSelectedTypes
        reconstructedUnits = reconstructed.units
      }

      form.reset({
        title: evidence.title || '',
        description: evidence.description || '',
        trainer_feedback: evidence.trainer_feedback || '',
        points_for_improvement: evidence.points_for_improvement || '',
        audio: null, // File needs to be re-uploaded
        file: null,
        learner_comments: evidence.learner_comments || '',
        evidence_time_log: evidence.evidence_time_log || false,
        session: evidence.session || '',
        grade: evidence.grade || '',
        declaration: declarationValue,
        assessment_method: assessmentMethodArray,
        selectedCourses:
          reconstructedCourses.length > 0 ? reconstructedCourses : [],
        courseSelectedTypes: courseSelectedTypes,
        units: reconstructedUnits.length > 0 ? reconstructedUnits : [],
        signatures: form.getValues('signatures'),
      })
    }
  }, [evidenceDetails, isEditMode, form, courses])

  const onSubmit = async (data: EvidenceFormValues) => {
    // Validate course selections before submitting
    if (!data.selectedCourses || data.selectedCourses.length === 0) {
      toast.error('Please select at least one course')
      return
    }

    // Validate Standard courses have type selected
    const standardCourses = data.selectedCourses.filter(
      (c) => c.course_core_type === COURSE_TYPES.STANDARD
    )
    for (const course of standardCourses) {
      const selectedTypes = data.courseSelectedTypes?.[course.course_id] || []
      if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) {
        toast.error(`Please select at least one type for ${course.course_name}`)
        return
      }
    }

    // Validate Qualification courses have units selected
    const qualificationCourses = data.selectedCourses.filter(
      (c) => c.course_core_type === COURSE_TYPES.QUALIFICATION
    )
    const formUnits = data.units || []
    for (const course of qualificationCourses) {
      const courseUnits = formUnits.filter(
        (u) => u.course_id === course.course_id
      )
      if (courseUnits.length === 0) {
        toast.error(`Please select at least one unit for ${course.course_name}`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && evidenceId) {
        const id = Number(evidenceId)
        const selectedCourses = data.selectedCourses || []

        // Step 1: Upload additional evidence (audio) if new file is selected
        if (data.audio && data.audio instanceof File) {
          const formData = new FormData()
          formData.append('audio', data.audio)
          const externalPayload = {
            id,
            data: formData,
          }
          await uploadExternalEvidenceFile(externalPayload).unwrap()
        }

        // Step 2: Update evidence (evidence-level fields only, NO units/course_id)
        const evidencePayload = {
          title: data.title,
          description: data.description || undefined,
          trainer_feedback: data.trainer_feedback || undefined,
          learner_comments: data.learner_comments || undefined,
          points_for_improvement: data.points_for_improvement || undefined,
          assessment_method: data.assessment_method || [],
          session: data.session || undefined,
          grade: data.grade || undefined,
          evidence_time_log: data.evidence_time_log || false,
          declaration: data.declaration ? 'true' : 'false',
        }
        await updateEvidence({
          id,
          data: evidencePayload as EvidenceUpdateRequest,
        }).unwrap()

        // Step 3: Handle mappings for each course/unit/subunit/topic combination
        // Map key: course_id-topic_id (for Qualification, topics are mapped; for Standard, subUnits or units are mapped)
        // Build desired mappings from form state
        const desiredMappings: Map<string, any> = new Map()

        formUnits.forEach((unit: any) => {
          const courseId = unit.course_id
          const course = selectedCourses.find(
            (c: any) => c.course_id === courseId
          )
          const isQualification =
            course?.course_core_type === COURSE_TYPES.QUALIFICATION
          const hasSubUnit = unit.subUnit && unit.subUnit.length > 0

          if (isQualification && hasSubUnit) {
            // For Qualification courses: map topics (Assessment Criteria) only
            unit.subUnit.forEach((subUnit: any) => {
              if (
                subUnit.topics &&
                Array.isArray(subUnit.topics) &&
                subUnit.topics.length > 0
              ) {
                subUnit.topics.forEach((topic: any) => {
                  // Only add to desiredMappings if learnerMap is true
                  if (topic.learnerMap === true) {
                    const key = `${courseId}-${topic.id}`
                    desiredMappings.set(key, {
                      assignment_id: Number(id),
                      course_id: Number(courseId),
                      unit_code: String(topic.id), // For qualification, unit_code = topic.id
                      learnerMap: true,
                      trainerMap: topic.trainerMap ?? false,
                      code: topic.code,
                      mapping_id: topic.mapping_id, // For updates (if exists)
                    })
                  }
                })
              }
            })
          } else if (hasSubUnit) {
            // For Standard courses: Unit has subunits - create mapping for each subunit
            // Only include mappings where learnerMap is true
            unit.subUnit.forEach((sub: any) => {
              // Only add to desiredMappings if learnerMap is true
              if (sub.learnerMap === true) {
                const key = `${courseId}-${sub.id}`
                desiredMappings.set(key, {
                  assignment_id: Number(id),
                  course_id: Number(courseId),
                  unit_code: String(sub.id),
                  learnerMap: true,
                  trainerMap: sub.trainerMap ?? false,
                  code: sub.code,
                  mapping_id: sub.mapping_id, // For updates (if exists)
                })
              }
            })
          } else {
            // Unit-only - create mapping for unit itself (unit_code = unit code)
            // Only include mappings where learnerMap is true
            if (unit.learnerMap === true) {
              const key = `${courseId}-${unit.id}`
              desiredMappings.set(key, {
                assignment_id: Number(id),
                course_id: Number(courseId),
                code: unit.code,
                unit_code: String(unit.id),
                learnerMap: true,
                trainerMap: unit.trainerMap ?? false,
                mapping_id: unit.mapping_id, // For updates (if exists)
              })
            }
          }
        })

        // Upsert mappings and collect mapping IDs
        const allMappingIds: number[] = []
        const desiredMappingsArray = Array.from(desiredMappings.entries())

        for (const [, desiredMapping] of desiredMappingsArray) {
          try {
            // Use merged upsert API - it handles both create and update
            const { mapping_id, ...payload } = desiredMapping
            const result = await upsertMapping(payload).unwrap()

            // Extract mapping_id from response
            // Response structure: { status: true, message: "...", data: [{ mapping_id: 11, ... }] }
            let mappingId: number | null = null

            if (
              result?.data &&
              Array.isArray(result.data) &&
              result.data.length > 0
            ) {
              // Get mapping_id from the first item in the data array
              mappingId = result.data[0]?.mapping_id || null
            } else if ((result as any)?.mapping_id) {
              // Fallback: direct mapping_id property
              mappingId = (result as any).mapping_id
            } else if ((result as any)?.id) {
              // Fallback: direct id property
              mappingId = (result as any).id
            } else if ((result as any)?.data?.mapping_id) {
              // Fallback: data.mapping_id (if data is not an array)
              mappingId = (result as any).data.mapping_id
            } else if (mapping_id) {
              // Final fallback: use existing mapping_id from desiredMapping
              mappingId = mapping_id
            }

            if (mappingId) {
              allMappingIds.push(mappingId)
            }
          } catch (error) {
            console.warn('Failed to upsert mapping:', error)
          }
        }

        // Step 4: Handle signatures per mapping (if signature_required is set)
        // Get required roles that need signatures
        const requiredRoles =
          data.signatures
            ?.filter((sig) => sig.signature_required)
            .map((sig) => sig.role) || []

        // Request signatures for each mapping with all required roles as array
        if (requiredRoles.length > 0 && allMappingIds.length > 0) {
          for (const mappingId of allMappingIds) {
            try {
              await requestSignature({
                id,
                data: {
                  roles: requiredRoles,
                },
              }).unwrap()
            } catch (error) {
              // Log error but don't fail the entire submission
              console.warn(
                `Failed to request signature for mapping ${mappingId}:`,
                error
              )
            }
          }
        }

        toast.success('Evidence updated successfully')
        router.push('/evidence-library')
      } else {
        // Create new evidence
        if (!data.file) {
          toast.error('Please upload a file or create a document')
          return
        }

        // Validate file is a File instance
        if (!(data.file instanceof File)) {
          toast.error('Invalid file. Please upload a file or create a document')
          return
        }

        // Create FormData with all required fields
        const formData = new FormData()
        formData.append('title', data.title)
        if (data.description) {
          formData.append('description', data.description)
        }
        formData.append('declaration', data.declaration ? 'true' : 'false')
        formData.append(
          'evidence_time_log',
          data.evidence_time_log ? 'true' : 'false'
        )
        formData.append('user_id', String(user?.id || ''))
        formData.append('file', data.file)

        // Create evidence
        const result = await createEvidence(formData).unwrap()
        const createdEvidenceId = result?.data?.assignment_id

        // Add additional evidence (audio) if provided
        if (data.audio && data.audio instanceof File) {
          const formDataAudio = new FormData()
          formDataAudio.append('audio', data.audio)
          const externalPayloadAudio = {
            id: createdEvidenceId,
            data: formDataAudio,
          }
          await uploadExternalEvidenceFile(externalPayloadAudio).unwrap()
        }

        if (!createdEvidenceId) {
          throw new Error('Failed to create evidence - no ID returned')
        }

        // Handle mappings for each course/unit/subunit/topic combination
        const selectedCourses = data.selectedCourses || []
        const formUnits = data.units || []
        const desiredMappings: Map<string, any> = new Map()

        formUnits.forEach((unit: any) => {
          const courseId = unit.course_id
          const course = selectedCourses.find(
            (c: any) => c.course_id === courseId
          )
          const isQualification =
            course?.course_core_type === COURSE_TYPES.QUALIFICATION
          const hasSubUnit = unit.subUnit && unit.subUnit.length > 0

          if (isQualification && hasSubUnit) {
            // For Qualification courses: map topics (Assessment Criteria) only
            unit.subUnit.forEach((subUnit: any) => {
              if (
                subUnit.topics &&
                Array.isArray(subUnit.topics) &&
                subUnit.topics.length > 0
              ) {
                subUnit.topics.forEach((topic: any) => {
                  // Only add to desiredMappings if learnerMap is true
                  if (topic.learnerMap === true) {
                    const key = `${courseId}-${topic.id}`
                    desiredMappings.set(key, {
                      assignment_id: Number(createdEvidenceId),
                      course_id: Number(courseId),
                      unit_code: String(topic.id), // For qualification, unit_code = topic.id
                      learnerMap: true,
                      trainerMap: topic.trainerMap ?? false,
                      code: topic.code,
                    })
                  }
                })
              }
            })
          } else if (hasSubUnit) {
            // For Standard courses: Unit has subunits - create mapping for each subunit
            // Only include mappings where learnerMap is true
            unit.subUnit.forEach((sub: any) => {
              // Only add to desiredMappings if learnerMap is true
              if (sub.learnerMap === true) {
                const key = `${courseId}-${sub.id}`
                desiredMappings.set(key, {
                  assignment_id: Number(createdEvidenceId),
                  course_id: Number(courseId),
                  unit_code: String(sub.id),
                  learnerMap: true,
                  trainerMap: sub.trainerMap ?? false,
                  code: sub.code,
                })
              }
            })
          } else {
            // Unit-only - create mapping for unit itself (unit_code = unit code)
            // Only include mappings where learnerMap is true
            if (unit.learnerMap === true) {
              const key = `${courseId}-${unit.id}`
              desiredMappings.set(key, {
                assignment_id: Number(createdEvidenceId),
                course_id: Number(courseId),
                code: unit.code,
                unit_code: String(unit.id),
                learnerMap: true,
                trainerMap: unit.trainerMap ?? false,
              })
            }
          }
        })

        // Upsert mappings and collect mapping IDs
        const allMappingIds: number[] = []
        const desiredMappingsArray = Array.from(desiredMappings.entries())

        for (const [, desiredMapping] of desiredMappingsArray) {
          try {
            const result = await upsertMapping(desiredMapping).unwrap()

            // Extract mapping_id from response
            let mappingId: number | null = null

            if (
              result?.data &&
              Array.isArray(result.data) &&
              result.data.length > 0
            ) {
              mappingId = result.data[0]?.mapping_id || null
            } else if ((result as any)?.mapping_id) {
              mappingId = (result as any).mapping_id
            } else if ((result as any)?.id) {
              mappingId = (result as any).id
            } else if ((result as any)?.data?.mapping_id) {
              mappingId = (result as any).data.mapping_id
            }

            if (mappingId) {
              allMappingIds.push(mappingId)
            }
          } catch (error) {
            console.warn('Failed to upsert mapping:', error)
          }
        }

        // Handle signatures per mapping (if signature_required is set)
        const requiredRoles =
          data.signatures
            ?.filter((sig) => sig.signature_required)
            .map((sig) => sig.role) || []

        // Request signatures for each mapping with all required roles as array
        if (requiredRoles.length > 0 && allMappingIds.length > 0) {
          for (const mappingId of allMappingIds) {
            try {
              await requestSignature({
                id: createdEvidenceId,
                data: {
                  roles: requiredRoles,
                },
              }).unwrap()
            } catch (error) {
              // Log error but don't fail the entire submission
              console.warn(
                `Failed to request signature for mapping ${mappingId}:`,
                error
              )
            }
          }
        }

        toast.success('Evidence created successfully')
        router.push("/evidence-library");
      }
    } catch (error) {
      toast.error('Failed to save evidence. Please try again.')
      console.error('Error saving evidence:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canEditLearnerFields = userRole === 'Learner'
  const canEditTrainerFields = ['Trainer', 'Admin', 'IQA'].includes(userRole)

  const unitsWatch = form.watch('units') || []

  // Qualification-specific handlers (for topics in Unit → subUnit → topics structure)
  const {
    learnerMapHandler: qualificationLearnerMapHandler,
    trainerMapHandler: qualificationTrainerMapHandler,
    signedOffHandler: qualificationSignedOffHandler,
    commentHandler: qualificationCommentHandler,
  } = useQualificationHandlers({
    units: unitsWatch || [],
    setValue: form.setValue,
    trigger: form.trigger,
  })

  // getEvidenceCount - Returns count of evidence submissions for a unit/topic
  // Note: For accurate counts, this would require a backend API endpoint like:
  // GET /evidence/count?course_id={courseId}&unit_id={unitId}&topic_id={topicId}
  // Or implementing a caching layer that tracks mappings after evidence creation.
  // For now, returns 0 as the count would require fetching all evidence to compute.

  const getEvidenceCount = (
    _courseId: number,
    _unitId: string | number,
    _topicId?: string | number
  ) => {
    // Backend TODO: Implement GET /assignment/count endpoint that returns count of
    // evidence mappings for a given course/unit/topic combination.
    // Example: { status: true, data: { count: 5 } }
    return 0
  }

  if (isLoadingDetails && isEditMode) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        <span className='ml-2 text-muted-foreground'>Loading evidence...</span>
      </div>
    )
  }

  const handleDocumentCreated = (file: File) => {
    form.setValue('file', file, { shouldValidate: true })
    toast.success(
      'Document created successfully! You can continue filling the form.'
    )
  }

  // Get file URL and name from evidence details for edit mode
  const existingFileUrl = evidenceDetails?.data?.file?.url
  const existingFileName = evidenceDetails?.data?.file?.name

  // Watch file field to determine if form should show other fields
  const fileValue = form.watch('file')
  const hasFile = fileValue !== null && fileValue !== undefined && (
    fileValue instanceof File || 
    (typeof fileValue === 'object' && fileValue !== null && 'url' in fileValue)
  )

  // Get file URL and name from file value (for create mode preview)
  const currentFileUrl = hasFile && !isEditMode
    ? (fileValue instanceof File 
        ? URL.createObjectURL(fileValue) 
        : (fileValue as any)?.url)
    : existingFileUrl
  const currentFileName = hasFile && !isEditMode
    ? (fileValue instanceof File 
        ? fileValue.name 
        : (fileValue as any)?.name)
    : existingFileName

  // In edit mode, always show the form (file already exists)
  // In create mode, only show form fields after file is uploaded/created
  const shouldShowFormFields = isEditMode || hasFile

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
      {/* File Upload / Create Document - Tabs in create mode (before file), Preview after file or in edit mode */}
      {isEditMode || hasFile ? (
        <CreateDocumentCard
          onDocumentCreated={handleDocumentCreated}
          disabled={!canEditLearnerFields}
          isEditMode={isEditMode || hasFile}
          fileUrl={currentFileUrl}
          fileName={currentFileName}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>File Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={fileTab} onValueChange={setFileTab} className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='upload' disabled={!canEditLearnerFields}>
                  <Upload className='h-4 w-4 mr-2' />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value='create' disabled={!canEditLearnerFields}>
                  <FileText className='h-4 w-4 mr-2' />
                  Create Document
                </TabsTrigger>
              </TabsList>

              <TabsContent value='upload' className='mt-4'>
                <Label>
                  Upload File <span className='text-destructive'>*</span>
                </Label>
                <div className='mt-2'>
                  <FileUpload
                    control={form.control as any}
                    name='file'
                    disabled={!canEditLearnerFields}
                    error={form.formState.errors.file}
                  />
                </div>
              </TabsContent>

              <TabsContent value='create' className='mt-4'>
                <div className='space-y-4'>
                  <CreateDocumentCard
                    onDocumentCreated={handleDocumentCreated}
                    disabled={!canEditLearnerFields}
                    isEditMode={false}
                  />
                  {form.formState.errors.file && (
                    <p className='text-sm text-destructive mt-2'>
                      {form.formState.errors.file.message}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Show rest of form only if file exists (or in edit mode) */}
      {shouldShowFormFields && (
        <>
          {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>
              Title <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='title'
              {...form.register('title')}
              placeholder='Enter evidence title'
              disabled={!canEditLearnerFields}
              className={
                form.formState.errors.title ? 'border-destructive' : ''
              }
            />
            {form.formState.errors.title && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              {...form.register('description')}
              placeholder='Enter description'
              rows={4}
              disabled={!canEditLearnerFields}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='trainer_feedback'>Trainer Feedback</Label>
              <Textarea
                id='trainer_feedback'
                {...form.register('trainer_feedback')}
                placeholder='Trainer feedback'
                rows={4}
                disabled={!canEditTrainerFields}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='points_for_improvement'>
                Points for Improvement
              </Label>
              <Textarea
                id='points_for_improvement'
                {...form.register('points_for_improvement')}
                placeholder='Points for improvement'
                rows={4}
                disabled={!canEditTrainerFields}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='learner_comments'>Learner Comments</Label>
            <Textarea
              id='learner_comments'
              {...form.register('learner_comments')}
              placeholder='Your comments'
              rows={4}
              disabled={!canEditLearnerFields}
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Course Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseSelection
            control={form.control as any}
            courses={courses}
            disabled={!canEditLearnerFields}
            error={form.formState.errors.selectedCourses as any}
            courseSelectedTypesError={form.formState.errors.courseSelectedTypes as any}
            unitsError={form.formState.errors.units as any}
            setValue={form.setValue as any}
            getValues={form.getValues}
          />
        </CardContent>
      </Card>

      {/* Units Table / Qualification Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const selectedCourses = form.watch('selectedCourses') || []

            const qualificationCourses = selectedCourses.filter(
              (c: any) => c.course_core_type === COURSE_TYPES.QUALIFICATION
            )

            const standardCourses = selectedCourses.filter(
              (c: any) => c.course_core_type === COURSE_TYPES.STANDARD
            )

            return (
              <div className='space-y-4'>
                {/* Qualification Courses */}
                {qualificationCourses.map((course: any) => {
                  const unitsWatch = form.watch('units') || []
                  const unitsError = form.formState.errors.units as any

                  // Get units for this course (Unit → subUnit → topics structure)
                  const displayUnits = (unitsWatch || []).filter(
                    (u: any) => u.course_id === course.course_id
                  )

                  // Check if there's an error for this course
                  // const hasError = unitsError && (displayUnits.length === 0 || displayUnits.some((unit: any) => {
                  //   // Check if unit has no learnerMap in topics
                  //   if ('subUnit' in unit && unit.subUnit && Array.isArray(unit.subUnit)) {
                  //     return !unit.subUnit.some((subUnit: any) => {
                  //       if (subUnit.topics && Array.isArray(subUnit.topics)) {
                  //         return subUnit.topics.some((topic: any) => topic.learnerMap === true)
                  //       }
                  //       return false
                  //     })
                  //   }
                  //   return false
                  // }))

                  return (
                    <div key={course.course_id} className='space-y-4 mb-4'>
                      <h3 className='font-semibold text-lg mb-2'>
                        {course.course_name} - Units
                      </h3>
                      {unitsError?.message && (
                        <p className='text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive rounded'>
                          {unitsError?.message}
                        </p>
                      )}
                      {displayUnits.length > 0 && (
                        displayUnits.map((unit: any) => {
                          return (
                            <QualificationHierarchyUnits
                              key={unit.id}
                              unit={unit}
                              unitsWatch={unitsWatch || []}
                              courseId={course.course_id}
                              disabled={!canEditLearnerFields}
                              canEditLearnerFields={canEditLearnerFields}
                              canEditTrainerFields={canEditTrainerFields}
                              learnerMapHandler={qualificationLearnerMapHandler}
                              trainerMapHandler={qualificationTrainerMapHandler}
                              signedOffHandler={qualificationSignedOffHandler}
                              commentHandler={qualificationCommentHandler}
                              getEvidenceCount={getEvidenceCount}
                            />
                          )
                        })
                      )}
                    </div>
                  )
                })}

                {/* Standard Courses */}
                {standardCourses.length > 0 && (
                  <UnitsTable
                    control={form.control as any}
                    courses={standardCourses}
                    disabled={!canEditLearnerFields}
                    error={form.formState.errors.units as any}
                  />
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Additional Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='audio'>Additional Evidence</Label>
            <FileUpload
              control={form.control as any}
              name='audio'
              disabled={!canEditLearnerFields}
              error={form.formState.errors.audio}
            />
            <p className='text-xs text-muted-foreground'>
              Optional: Upload additional evidence file (audio, video, or
              document)
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='session'>Session</Label>
              <Controller
                name='session'
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled={isEditMode || !canEditLearnerFields}
                  >
                    <SelectTrigger id='session' className='w-full'>
                      <SelectValue placeholder='Select session' />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingLearnerPlan ? (
                        <div className='flex items-center justify-center py-2 px-2 text-sm text-muted-foreground'>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Loading sessions...
                        </div>
                      ) : sessions.length > 0 ? (
                        sessions.map((session) => (
                          <SelectItem key={session.id} value={String(session.id)}>
                            {session.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className='py-2 px-2 text-sm text-muted-foreground'>
                          No sessions available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.session && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.session.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='grade'>Grade</Label>
              <Input
                id='grade'
                {...form.register('grade')}
                placeholder='Enter grade'
                disabled={!canEditLearnerFields}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Evidence to be used in time log?</Label>
            <Controller
              name='evidence_time_log'
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value ? 'yes' : 'no'}
                  onValueChange={(value) => field.onChange(value === 'yes')}
                  disabled={!canEditLearnerFields}
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='yes' id='yes' />
                    <Label htmlFor='yes'>Yes</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='no' id='no' />
                    <Label htmlFor='no'>No</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className='space-y-2'>
            <Label>Assessment Method <span className='text-destructive'>*</span></Label>
            <div className='flex flex-wrap gap-4'>
              {ASSESSMENT_METHODS.map((method) => {
                const checkboxId = `assessment-method-${method.value
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`
                return (
                  <div key={method.value} className='flex items-center space-x-2'>
                    <Controller
                      name='assessment_method'
                      control={form.control}
                      render={({ field }) => (
                        <Checkbox
                          id={checkboxId}
                          checked={field.value?.includes(method.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || []
                            if (checked) {
                              field.onChange([...current, method.value])
                            } else {
                              field.onChange(
                                current.filter((m) => m !== method.value)
                              )
                            }
                          }}
                          disabled={!canEditLearnerFields}
                        />
                      )}
                    />
                    <Label htmlFor={checkboxId} className='cursor-pointer'>
                      {method.title}
                    </Label>
                  </div>
                )
              })}
            </div>
            {form.formState.errors.assessment_method && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.assessment_method.message}
              </p>
            )}
          </div>

          {!canEditTrainerFields && (
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Controller
                  name='declaration'
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id='declaration-checkbox'
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canEditLearnerFields}
                    />
                  )}
                />
                <Label
                  htmlFor='declaration-checkbox'
                  className='cursor-pointer'
                >
                  I declare that this evidence is my own work{' '}
                  <span className='text-destructive'>*</span>
                </Label>
              </div>
              {form.formState.errors.declaration && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.declaration.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <SignatureTable
            control={form.control as any}
            errors={form.formState.errors as any}
            watch={form.watch}
            disabled={!canEditLearnerFields}
          />
        </CardContent>
      </Card>

          {/* Form Actions */}
          <div className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/evidence-library')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : isEditMode ? (
                'Update Evidence'
              ) : (
                'Create Evidence'
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
