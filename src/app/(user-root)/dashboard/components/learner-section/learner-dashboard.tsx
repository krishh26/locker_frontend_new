'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { setLearnerData } from '@/store/slices/authSlice'
import { overviewCards } from '../../data/portfolio-data'
import { SafeguardingCard } from './safeguarding-card'
import { useUpdateLearnerMutation } from '@/store/api/learner/learnerApi'
import { toast } from 'sonner'

export function LearnerDashboard() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const learner = useAppSelector((state) => state.auth.learner)

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false)
  const [isAcknowledgementOpen, setIsAcknowledgementOpen] = useState(false)

  const [updateLearner] = useUpdateLearnerMutation()

  // Get learner's isShowMessage value
  const learnerIsShowMessage = (learner as { isShowMessage?: boolean })?.isShowMessage
  const learnerId = learner?.learner_id

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
    ) {
      setIsAcknowledgementOpen(true)
    }
  }, [learnerId, learnerIsShowMessage, isAcknowledgementOpen])

  // Handle acknowledgement close
  const handleAcknowledgementClose = async () => {
    if (learner?.learner_id) {
      try {
        // Preserve all existing learner data and only update isShowMessage
        const response = await updateLearner({
          id: learner.learner_id,
          data: {
            isShowMessage: false,
          },
        }).unwrap()
        if (response.data) {
          dispatch(setLearnerData(response.data))
          setIsAcknowledgementOpen(false)
        }
      } catch (error) {
        const errorMessage =
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.error ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.message ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.message ||
          'Failed to update acknowledgement status'
        toast.error(errorMessage)
      }
    } else {
      setIsAcknowledgementOpen(false)
    }
  }

  // Handle acknowledgement accept
  const handleAcknowledgementAccept = async () => {
    if (learner?.learner_id) {
      try {
        // Preserve all existing learner data and only update isShowMessage
        const response = await updateLearner({
          id: learner.learner_id,
          data: {
            isShowMessage: false,
          },
        }).unwrap()
        // Update learner data in Redux store with the response
        if (response.data) {
          dispatch(setLearnerData(response.data))
          setIsAcknowledgementOpen(false)
        }
        toast.success('Acknowledgement accepted successfully')
      } catch (error) {
        const errorMessage =
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.error ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.message ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.message ||
          'Failed to update acknowledgement status'
        toast.error(errorMessage)
      }
    } else {
      setIsAcknowledgementOpen(false)
    }
  }

  // Get count data for portfolio cards
  const countData = useMemo(() => {
    // TODO: Fetch actual count data from API
    return {
      newDocTotal: 0,
    }
  }, [])

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
          onClose={handleAcknowledgementClose}
          onAccept={handleAcknowledgementAccept}
          learnerName={`${learner.first_name} ${learner.last_name}`}
        />
      )}
    </>
  )
}
