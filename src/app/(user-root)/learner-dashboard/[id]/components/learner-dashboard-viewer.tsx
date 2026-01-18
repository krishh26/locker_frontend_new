'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGetLearnerDetailsQuery } from '@/store/api/learner/learnerApi'
import { useAppDispatch } from '@/store/hooks'
import { setLearnerData } from '@/store/slices/authSlice'
import { LearnerDashboard } from '@/app/(user-root)/dashboard/components/learner-section/learner-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'

interface LearnerDashboardViewerProps {
  learnerId: string
}

export function LearnerDashboardViewer({
  learnerId,
}: LearnerDashboardViewerProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Parse learner ID from string to number
  const learnerIdNum = parseInt(learnerId, 10)

  // Fetch learner details
  const {
    data: learnerResponse,
    isLoading,
    isError,
    error,
  } = useGetLearnerDetailsQuery(learnerIdNum, {
    skip: isNaN(learnerIdNum),
  })

  // Store learner data in Redux when fetched
  useEffect(() => {
    if (learnerResponse?.data) {
      dispatch(setLearnerData(learnerResponse.data))
    }
  }, [learnerResponse, dispatch])

  // Handle loading state
  if (isLoading) {
    return (
      <div className='space-y-6 px-4 lg:px-6'>
        <Skeleton className='h-12 w-64' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
        <Skeleton className='h-96' />
      </div>
    )
  }

  // Handle error state
  if (isError || isNaN(learnerIdNum)) {
    return (
      <div className='px-4 lg:px-6 py-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error Loading Learner Dashboard</AlertTitle>
          <AlertDescription className='mt-2'>
            {error
              ? 'message' in error
                ? String(error.message)
                : 'Failed to load learner details'
              : 'Invalid learner ID'}
            <div className='mt-4'>
              <Button
                variant='outline'
                onClick={() => router.push('/learner-overview')}
              >
                Back to Learner Overview
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render learner dashboard once data is loaded
  return (
    <>
      <div className='px-4 lg:px-6'>
        <PageHeader
          title={`Learner Dashboard - ${learnerResponse?.data?.first_name} ${learnerResponse?.data?.last_name}`}
          backButtonHref='/'
          showBackButton
        />
      </div>
      <LearnerDashboard />
    </>
  )
}
