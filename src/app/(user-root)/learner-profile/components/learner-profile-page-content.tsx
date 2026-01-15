'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useGetLearnerDetailsQuery,
  useUpdateLearnerMutation,
} from '@/store/api/learner/learnerApi'
import { useAppSelector } from '@/store/hooks'
import { PageHeader } from '@/components/dashboard/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, User, BookOpen, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentIdSection } from './sections/student-id-section'
import { AboutYouSection } from './sections/about-you-section'
import { AddressSection } from './sections/address-section'
import { EmployerSection } from './sections/employer-section'
import { FundingBodySection } from './sections/funding-body-section'
import { AdditionalInfoSection } from './sections/additional-info-section'
import { FundingBandsSection } from './sections/funding-bands-section'
import { CourseInformationTab } from './course-information-tab'
import { toast } from 'sonner'
import type {
  LearnerData,
  UpdateLearnerRequest,
} from '@/store/api/learner/types'

// Form schema for learner profile
const learnerProfileSchema = z.object({
  // Student ID
  uln: z.string().optional(),
  mis_learner_id: z.string().optional(),
  student_id: z.string().optional(),
  // About You
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  user_name: z.string().min(1, 'Username is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  national_ins_no: z.string().optional(),
  ethnicity: z.string().optional(),
  learner_disability: z.string().optional(),
  learner_difficulity: z.string().optional(),
  Initial_Assessment_Numeracy: z.string().optional(),
  Initial_Assessment_Literacy: z.string().optional(),
  Initial_Assessment_ICT: z.string().optional(),
  // Address
  street: z.string().optional(),
  suburb: z.string().optional(),
  town: z.string().optional(),
  country: z.string().optional(),
  home_postcode: z.string().optional(),
  country_of_domicile: z.string().optional(),
  // Employer
  employer_id: z.string().optional(),
  job_title: z.string().optional(),
  location: z.string().optional(),
  manager_name: z.string().optional(),
  manager_job_title: z.string().optional(),
  mentor: z.string().optional(),
  // Funding Body
  funding_body: z.string().optional(),
  awarding_body: z.string().optional(),
  registration_number: z.string().optional(),
  registration_date: z.string().optional(),
  lara_code: z.string().optional(),
  // Additional Info
  cost_centre: z.string().optional(),
  funding_contractor: z.string().optional(),
  partner: z.string().optional(),
  sub_area: z.string().optional(),
  cohort: z.string().optional(),
  curriculum_area: z.string().optional(),
  ssa1: z.string().optional(),
  ssa2: z.string().optional(),
  director_of_curriculum: z.string().optional(),
  learner_type: z.string().optional(),
  expected_off_the_job_hours: z.string().optional(),
  off_the_job_training: z.string().optional(),
  guided_learning_hours_achieved: z.string().optional(),
  // Funding Bands
  custom_amount: z.number().optional(),
  original_amount: z.number().optional(),
  funding_band_id: z.number().optional(),
})

type LearnerProfileFormValues = z.infer<typeof learnerProfileSchema>

interface LearnerProfilePageContentProps {
  learnerId: string | null
}

// Helper function to format date for input
const formatDateForInput = (date: string | undefined | null): string => {
  if (!date) return ''
  try {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

// Helper function to get default values from learner data
const getDefaultValues = (
  learner: LearnerData | undefined
): LearnerProfileFormValues => {
  if (!learner) {
    return {} as LearnerProfileFormValues
  }

  return {
    uln: (learner as { uln?: string }).uln || '',
    mis_learner_id:
      (learner as { mis_learner_id?: string }).mis_learner_id || '',
    student_id: (learner as { student_id?: string }).student_id || '',
    first_name: learner.first_name || '',
    last_name: learner.last_name || '',
    user_name: learner.user_name || '',
    email: learner.email || '',
    telephone: (learner as { telephone?: string }).telephone || '',
    mobile: learner.mobile || '',
    dob: formatDateForInput((learner as { dob?: string }).dob),
    gender: (learner as { gender?: string }).gender || '',
    national_ins_no: learner.national_ins_no || '',
    ethnicity: (learner as { ethnicity?: string }).ethnicity || '',
    learner_disability:
      (learner as { learner_disability?: string }).learner_disability || '',
    learner_difficulity:
      (learner as { learner_difficulity?: string }).learner_difficulity || '',
    Initial_Assessment_Numeracy:
      (learner as { Initial_Assessment_Numeracy?: string })
        .Initial_Assessment_Numeracy || '',
    Initial_Assessment_Literacy:
      (learner as { Initial_Assessment_Literacy?: string })
        .Initial_Assessment_Literacy || '',
    Initial_Assessment_ICT:
      (learner as { Initial_Assessment_ICT?: string }).Initial_Assessment_ICT ||
      '',
    street: (learner as { street?: string }).street || '',
    suburb: (learner as { suburb?: string }).suburb || '',
    town: (learner as { town?: string }).town || '',
    country: (learner as { country?: string }).country || '',
    home_postcode: (learner as { home_postcode?: string }).home_postcode || '',
    country_of_domicile:
      (learner as { country_of_domicile?: string }).country_of_domicile || '',
    employer_id:
      (learner as { employer_id?: number }).employer_id?.toString() || '',
    job_title: (learner as { job_title?: string }).job_title || '',
    location: (learner as { location?: string }).location || '',
    manager_name: (learner as { manager_name?: string }).manager_name || '',
    manager_job_title:
      (learner as { manager_job_title?: string }).manager_job_title || '',
    mentor: (learner as { mentor?: string }).mentor || '',
    funding_body: learner.funding_body || '',
    awarding_body: (learner as { awarding_body?: string }).awarding_body || '',
    registration_number:
      (learner as { registration_number?: string }).registration_number || '',
    registration_date: formatDateForInput(
      (learner as { registration_date?: string }).registration_date
    ),
    lara_code: (learner as { lara_code?: string }).lara_code || '',
    cost_centre: (learner as { cost_centre?: string }).cost_centre || '',
    funding_contractor:
      (learner as { funding_contractor?: string }).funding_contractor || '',
    partner: (learner as { partner?: string }).partner || '',
    sub_area: (learner as { sub_area?: string }).sub_area || '',
    cohort: (learner as { cohort?: string }).cohort || '',
    curriculum_area:
      (learner as { curriculum_area?: string }).curriculum_area || '',
    ssa1: (learner as { ssa1?: string }).ssa1 || '',
    ssa2: (learner as { ssa2?: string }).ssa2 || '',
    director_of_curriculum:
      (learner as { director_of_curriculum?: string }).director_of_curriculum ||
      '',
    learner_type: (learner as { learner_type?: string }).learner_type || '',
    expected_off_the_job_hours:
      (
        learner as { expected_off_the_job_hours?: string | number }
      ).expected_off_the_job_hours?.toString() || '',
    off_the_job_training:
      (learner as { off_the_job_training?: string }).off_the_job_training || '',
    guided_learning_hours_achieved:
      (
        learner as { guided_learning_hours_achieved?: string | number }
      ).guided_learning_hours_achieved?.toString() || '',
    custom_amount: learner.custom_funding_data?.custom_amount,
    original_amount: learner.custom_funding_data?.original_amount,
    funding_band_id: learner.custom_funding_data?.funding_band_id,
  }
}

export function LearnerProfilePageContent({
  learnerId,
}: LearnerProfilePageContentProps) {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const userRole = user?.role
  const isLearner = userRole === 'Learner'
  const isAdmin = userRole === 'Admin'
  const isTrainer = userRole === 'Trainer'
  const canEdit = isAdmin || isTrainer

  const learnerIdNum = learnerId ? parseInt(learnerId, 10) : NaN

  const {
    data: learnerResponse,
    isLoading,
    isError,
    error,
  } = useGetLearnerDetailsQuery(learnerIdNum, {
    skip: !learnerId || isNaN(learnerIdNum),
  })

  const learner = learnerResponse?.data
  const [activeTab, setActiveTab] = useState('personal')
  const [updateLearner, { isLoading: isUpdating }] = useUpdateLearnerMutation()

  // Set up form
  const form = useForm<LearnerProfileFormValues>({
    resolver: zodResolver(learnerProfileSchema),
    defaultValues: getDefaultValues(learner),
    mode: 'onChange',
  })

  // Reset form when learner data loads
  useEffect(() => {
    if (learner) {
      form.reset(getDefaultValues(learner))
    }
  }, [learner, form])

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data) => {
    if (!learner || !canEdit) return

    try {
      // Map form data to API request format
      const updateData: Record<string, unknown> = {}

      // Only include fields that have values
      Object.entries(data).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Convert string numbers back to numbers for certain fields
          if (key === 'employer_id' && value) {
            updateData[key] = value
          } else if (
            key === 'custom_amount' ||
            key === 'original_amount' ||
            key === 'funding_band_id'
          ) {
            if (typeof value === 'number') {
              updateData[key] = value
            }
          } else {
            updateData[key] = value
          }
        }
      })

      await updateLearner({
        id: learner.learner_id,
        data: updateData as Partial<UpdateLearnerRequest>,
      }).unwrap()

      toast.success('Learner profile updated successfully')
    } catch (error) {
      console.error('Failed to update learner:', error)
      toast.error('Failed to update learner profile. Please try again.')
    }
  })

  // Determine back button href based on role
  const backButtonHref = isLearner ? '/dashboard' : '/learner-overview'

  // Handle loading state
  if (isLoading) {
    return (
      <div className='space-y-6 px-4 lg:px-6 pb-8'>
        <Skeleton className='h-12 w-64' />
        <Skeleton className='h-96' />
      </div>
    )
  }

  // Handle error state
  if (isError || !learnerId || isNaN(learnerIdNum)) {
    return (
      <div className='px-4 lg:px-6 py-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error Loading Learner Profile</AlertTitle>
          <AlertDescription className='mt-2'>
            {error
              ? 'message' in error
                ? String(error.message)
                : 'Failed to load learner details'
              : 'Invalid learner ID'}
            <div className='mt-4'>
              <Button
                variant='outline'
                onClick={() => router.push(backButtonHref)}
              >
                Back
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!learner) {
    return (
      <div className='px-4 lg:px-6 py-6'>
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>No Data Found</AlertTitle>
          <AlertDescription className='mt-2'>
            Learner profile data not found.
            <div className='mt-4'>
              <Button
                variant='outline'
                onClick={() => router.push(backButtonHref)}
              >
                Back
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='space-y-6 px-4 lg:px-6 pb-8'>
      {/* Page Header */}
      <PageHeader
        title='Profile Information'
        subtitle='View learner profile details and personal information'
        icon={User}
        showBackButton
        backButtonHref={backButtonHref}
      />

      {/* Profile Content with Tabs */}
      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full gap-4'
          >
            <TabsList>
              <TabsTrigger
                value='personal'
                className='flex items-center gap-1 px-2.5 sm:px-3'
              >
                <User className='h-4 w-4' />
                Personal Information
              </TabsTrigger>
              <TabsTrigger
                value='course'
                className='flex items-center gap-1 px-2.5 sm:px-3'
              >
                <BookOpen className='h-4 w-4' />
                Course Information
              </TabsTrigger>
            </TabsList>

            <CardContent>
              <TabsContent value='personal' className='mt-0 space-y-6'>
                <StudentIdSection learner={learner} canEdit={canEdit} />
                <AboutYouSection learner={learner} canEdit={canEdit} />
                <AddressSection learner={learner} canEdit={canEdit} />
                <EmployerSection learner={learner} canEdit={canEdit} />
                <FundingBodySection learner={learner} canEdit={canEdit} />
                <AdditionalInfoSection learner={learner} canEdit={canEdit} />
                <FundingBandsSection learner={learner} canEdit={canEdit} />
                {canEdit && (
                  <div className='flex justify-end pt-4 border-t'>
                    <Button type='submit' disabled={isUpdating}>
                      <Save className='h-4 w-4 mr-2' />
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value='course' className='mt-0'>
                <CourseInformationTab learner={learner} canEdit={canEdit} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </form>
      </FormProvider>
    </div>
  )
}
