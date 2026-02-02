'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from "@/i18n/navigation"
import { useGetPendingSignaturesQuery } from '@/store/api/documents-to-sign/documentsToSignApi'
import { useGetEvidenceListQuery } from '@/store/api/evidence/evidenceApi'
import { useGetCpdEntriesQuery } from '@/store/api/cpd/cpdApi'
import { useGetLearnerPlanListQuery } from '@/store/api/learner-plan/learnerPlanApi'
import { useGetResourcesByCourseQuery } from '@/store/api/resources/resourcesApi'
import type { PortfolioCountData } from '@/store/api/dashboard/types'
import { LayoutDashboard, Mail, Calendar, FileSignature } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PortfolioMetricCards } from './portfolio-metric-cards'
import { LearnerInfoCard } from './learner-info-card'
import { CourseProgressCharts } from './course-progress-charts'
import { EmailDialog } from './email-dialog'
import { CalendarDialog } from './calendar-dialog'
import { AcknowledgementDialog } from './acknowledgement-dialog'
import { Button } from '@/components/ui/button'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { clearCurrentCourseId } from '@/store/slices/courseSlice'
import { overviewCards } from '../../data/portfolio-data'
import { SafeguardingCard } from './safeguarding-card'

export function LearnerDashboard() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const learner = useAppSelector((state) => state.auth.learner)

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false)
  const [isAcknowledgementOpen, setIsAcknowledgementOpen] = useState(false)

  // Get learner's isShowMessage value
  const learnerIsShowMessage = (learner as { isShowMessage?: boolean })?.isShowMessage
  const learnerId = learner?.learner_id
  const userRole = user?.role

  // Reset course ID when dashboard mounts
  useEffect(() => {
    dispatch(clearCurrentCourseId())
  }, [dispatch])

  // Auto-open acknowledgement dialog when learner has isShowMessage set to true
  useEffect(() => {
    if (
      learnerId &&  
      learnerIsShowMessage === true &&
      !isAcknowledgementOpen
      && userRole === 'Learner'
    ) {
      setIsAcknowledgementOpen(true)
    }
  }, [learnerId, learnerIsShowMessage, isAcknowledgementOpen, userRole])

  const firstCourse = learner?.course?.[0]
  const firstCourseId = firstCourse?.course?.course_id

  // Portfolio counts from RTK Query
  const { data: pendingSignaturesData } = useGetPendingSignaturesQuery(
    { id: String(user?.id) },
    { skip: !user?.id }
  )
  const { data: evidenceData } = useGetEvidenceListQuery(
    { user_id: user?.id, page: 1, limit: 1, meta: true },
    { skip: !user?.id }
  )
  const { data: cpdData } = useGetCpdEntriesQuery(undefined, {
    skip: user?.role !== 'Learner',
  })
  const { data: learnerPlanData } = useGetLearnerPlanListQuery(
    { learners: String(learnerId ?? ''), meta: true },
    { skip: !learnerId }
  )
  const { data: resourcesData } = useGetResourcesByCourseQuery(
    {
      course_id: firstCourseId ?? 0,
      user_id: user?.id ?? '',
    },
    { skip: !firstCourseId || !user?.id }
  )

  const countData: PortfolioCountData = useMemo(() => {
    const newDocTotal = pendingSignaturesData?.data?.length ?? 0
    const evidenceTotal =
      evidenceData?.meta_data?.items ?? evidenceData?.data?.length ?? 0
    const gapsTotal = cpdData?.data?.length ?? 0
    const sessionsTotal =
      learnerPlanData?.meta_data?.items ?? learnerPlanData?.data?.length ?? 0
    const resourcesTotal = resourcesData?.data?.length ?? 0

    const uc = firstCourse as
      | {
          unitsNotStarted?: number
          unitsFullyCompleted?: number
          unitsPartiallyCompleted?: number
          totalUnits?: number
          available_units?: number
        }
      | undefined
    const unitsSum =
      Number(uc?.unitsNotStarted ?? 0) +
      Number(uc?.unitsFullyCompleted ?? 0) +
      Number(uc?.unitsPartiallyCompleted ?? 0)
    const unitsTotal = (uc?.totalUnits ?? unitsSum) || 0
    const unitsCompleted = Number(uc?.unitsFullyCompleted ?? 0)
    const progressPercentage =
      unitsTotal > 0 ? Math.round((unitsCompleted / unitsTotal) * 100) : 0
    const availableUnits = Number(uc?.available_units ?? 0)
    const selectedUnits = unitsTotal || 0

    return {
      evidenceTotal,
      unitsTotal: unitsTotal || undefined,
      unitsCompleted: unitsCompleted || undefined,
      progressPercentage: progressPercentage || undefined,
      gapsTotal: gapsTotal || undefined,
      availableUnits: availableUnits || undefined,
      selectedUnits: selectedUnits || undefined,
      sessionsTotal: sessionsTotal || undefined,
      resourcesTotal: resourcesTotal || undefined,
      newDocTotal,
    }
  }, [
    pendingSignaturesData?.data?.length,
    evidenceData?.meta_data?.items,
    evidenceData?.data?.length,
    cpdData?.data?.length,
    learnerPlanData?.meta_data?.items,
    learnerPlanData?.data?.length,
    resourcesData?.data?.length,
    firstCourse,
  ])

  return (
    <>
      <div className='px-4 lg:px-6'>
        <PageHeader
          title='Dashboard'
          subtitle='Manage your learning journey and track progress'
          icon={LayoutDashboard}
        />
      </div>

      <div className='px-4 lg:px-6 space-y-6'>
        {/* Portfolio Metric Cards */}
        <PortfolioMetricCards cards={overviewCards} countData={countData} />

        {/* Learner Information Card */}
        {learner && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <LearnerInfoCard learner={learner as any} user={user || undefined} />
        )}

        {/* Course Progress Charts */}
        {learner?.course && learner.course.length > 0 && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <CourseProgressCharts courses={learner.course as any} />
        )}

        {/* Time Log and Safeguarding Cards Grid */}
        <div className='grid gap-4 xl:grid-cols-[1.5fr_1fr]'>
          <SafeguardingCard />
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3 justify-end'>
          {user?.role !== 'Learner' && (
            <Button
              variant='outline'
              onClick={() => setIsEmailDialogOpen(true)}
              className='gap-2'
            >
              <Mail className='h-4 w-4' />
              Email Learner
            </Button>
          )}
          <Button
            variant='outline'
            onClick={() => router.push('/learners-documents-to-sign')}
            className='gap-2'
          >
            <FileSignature className='h-4 w-4' />
            Awaiting Signature
          </Button>
          <Button
            variant='default'
            onClick={() => setIsCalendarDialogOpen(true)}
            className='gap-2'
          >
            <Calendar className='h-4 w-4' />
            Calendar
          </Button>
        </div>
      </div>

      {/* Email Dialog */}
      <EmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        learnerEmail={learner?.email}
        learnerName={
          learner ? `${learner.first_name} ${learner.last_name}` : ''
        }
      />

      {/* Calendar Dialog */}
      <CalendarDialog
        open={isCalendarDialogOpen}
        onOpenChange={setIsCalendarDialogOpen}
      />

      {/* Acknowledgement Dialog */}
      {learner && (
        <AcknowledgementDialog
          open={isAcknowledgementOpen}
          onOpenChange={setIsAcknowledgementOpen}
          learnerId={learner.learner_id}
          learnerName={`${learner.first_name} ${learner.last_name}`}
        />
      )}
    </>
  )
}
