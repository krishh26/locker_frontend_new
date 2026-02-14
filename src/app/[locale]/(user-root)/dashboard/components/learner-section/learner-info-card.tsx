'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Learner {
  learner_id?: string | number
  first_name?: string
  last_name?: string
  email?: string
  avatar?: string
  user_name?: string
  nextvisitdate?: string
  course?: Array<{
    trainer_id?: {
      first_name: string
      last_name: string
      email: string
    }
    IQA_id?: {
      first_name: string
      last_name: string
    }
    course?: {
      course_name: string
      course_core_type?: string
    }
    start_date?: string
    end_date?: string
    questions?: Array<{
      achieved?: boolean
    }>
    unitsNotStarted?: number
    unitsFullyCompleted?: number
    unitsPartiallyCompleted?: number
    totalUnits?: number
  }>
}

interface User {
  first_name?: string
  last_name?: string
  email?: string
  avatar?: {
    url?: string
  }
}

interface LearnerInfoCardProps {
  learner: Learner
  user?: User
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

// Convert incoming data to progress format
const convertToProgressData = (
  data: Learner['course'] extends Array<infer T> ? T : never | null | undefined
) => {
  if (!data)
    return {
      yetToComplete: 0,
      fullyCompleted: 0,
      workInProgress: 0,
      totalUnits: 0,
    }

  try {
    const courseData = data as Learner['course'] extends Array<infer T>
      ? T
      : never
    const coreType = (courseData as { course?: { course_core_type?: string } })
      ?.course?.course_core_type
    const isGateway = coreType === 'Gateway'
    const questions = Array.isArray(
      (courseData as { course?: { questions?: Array<{ achieved?: boolean }> } })
        ?.course?.questions
    )
      ? (courseData as { course: { questions: Array<{ achieved?: boolean }> } })
          .course.questions
      : Array.isArray(
          (courseData as { questions?: Array<{ achieved?: boolean }> })
            ?.questions
        )
      ? (courseData as { questions: Array<{ achieved?: boolean }> }).questions
      : []

    if (isGateway && questions.length > 0) {
      const totalUnits = questions.length
      const fullyCompleted = questions.filter(
        (q: { achieved?: boolean }) => q?.achieved === true
      ).length

      return {
        yetToComplete: Math.max(0, totalUnits - fullyCompleted),
        fullyCompleted,
        workInProgress: 0,
        totalUnits,
      }
    }
  } catch {}

  const courseData = data as {
    unitsNotStarted?: number
    unitsFullyCompleted?: number
    unitsPartiallyCompleted?: number
    totalUnits?: number
  }
  return {
    yetToComplete: courseData.unitsNotStarted || 0,
    fullyCompleted: courseData.unitsFullyCompleted || 0,
    workInProgress: courseData.unitsPartiallyCompleted || 0,
    totalUnits: courseData.totalUnits || 0,
  }
}

export function LearnerInfoCard({ learner, user }: LearnerInfoCardProps) {
  // Calculate overall progress across all courses
  const overallProgressData = useMemo(() => {
    if (!learner?.course || learner.course.length === 0) {
      return {
        yetToComplete: 0,
        fullyCompleted: 0,
        workInProgress: 0,
        totalUnits: 0,
        completionPercentage: 0,
      }
    }

    let totalCompleted = 0
    let totalInProgress = 0
    let totalNotStarted = 0
    let totalUnitsAll = 0

    learner.course.forEach((course) => {
      const progressData = convertToProgressData(
        course as Learner['course'] extends Array<infer T> ? T : never
      )
      totalCompleted += progressData.fullyCompleted
      totalInProgress += progressData.workInProgress
      totalNotStarted += progressData.yetToComplete
      totalUnitsAll += progressData.totalUnits
    })

    const completionPercentage =
      totalUnitsAll > 0
        ? (totalCompleted / totalUnitsAll) * 100 +
          (totalInProgress / totalUnitsAll) * 50
        : 0

    return {
      yetToComplete: totalNotStarted,
      fullyCompleted: totalCompleted,
      workInProgress: totalInProgress,
      totalUnits: totalUnitsAll,
      completionPercentage,
    }
  }, [learner?.course])

  const learnerName = learner
    ? `${learner.first_name || ''} ${learner.last_name || ''}`.trim()
    : user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : 'Learner'

  const avatarUrl = learner?.avatar || user?.avatar?.url
  const initials = initialsFromName(learnerName)

  const trainerName = learner?.course?.[0]?.trainer_id
    ? `${learner.course[0].trainer_id.first_name} ${learner.course[0].trainer_id.last_name}`
    : 'N/A'

  const iqaName = learner?.course?.[0]?.IQA_id
    ? `${learner.course[0].IQA_id.first_name} ${learner.course[0].IQA_id.last_name}`
    : 'N/A'

  const completion = Math.min(
    Math.max(overallProgressData.completionPercentage, 0),
    100
  )

 
  return (
    <Card className='overflow-hidden border border-border/60 shadow-sm'>
      <div className='grid lg:grid-cols-[1fr_1fr]'>
        {/* Left Section - Dark Background with Learner Info */}
        <div className='px-4'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-start gap-4'>
              <Avatar className='size-16 border-2 border-primary/30 shadow-md'>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={learnerName}
                    width={64}
                    height={64}
                    className='rounded-full object-cover'
                  />
                ) : (
                  <AvatarFallback className='bg-primary text-base font-semibold text-primary-foreground'>
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className='space-y-1'>
                <h2 className='text-2xl font-semibold text-foreground'>{learnerName}</h2>
                <Button
                  variant='link'
                  size='sm'
                  asChild
                  className='h-auto p-0 text-muted-foreground hover:text-primary'
                >
                  <Link
                    href={`/learner-profile?learner_id=${String(
                      learner?.learner_id || ''
                    )}`}
                  >
                    <span className='text-sm'>View Profile</span>
                    <ArrowRight className='ml-1 size-4' />
                  </Link>
                </Button>
              </div>
            </div>

            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2 rounded-md bg-white/60 dark:bg-white/5 px-3 py-1.5'>
                <span className='text-muted-foreground'>Trainer:</span>
                <span className='text-foreground font-medium'>{trainerName}</span>
              </div>
              <div className='flex items-center gap-2 rounded-md bg-white/60 dark:bg-white/5 px-3 py-1.5'>
                <span className='text-muted-foreground'>IQA:</span>
                <span className='text-foreground font-medium'>{iqaName}</span>
              </div>
            </div>

            <Badge
              variant='outline'
              className='w-fit rounded-full px-4 py-2 shadow-sm border-primary bg-primary text-white'
            >
              Next Visit: {learner?.nextvisitdate || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* Right Section - Overall Progress and Time Log */}
        <div className='flex flex-col lg:flex-row gap-4 px-4'>
          {/* Overall Progress Card */}
          <div className='flex-1 min-w-[280px] rounded-lg border border-accent bg-accent p-4 shadow-sm'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-white'>Overall Progress</h3>
              <Badge
                variant='outline'
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-semibold shadow-sm',
                  completion >= 70
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-white/30 bg-white/10 text-white'
                )}
              >
                {completion.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={completion} className='h-2 mb-4' />
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div className='space-y-1 rounded-lg bg-white/10 p-2'>
                <p className='text-xs text-white font-medium'>✓ Completed</p>
                <p className='text-lg font-bold text-white'>
                  {overallProgressData.fullyCompleted}
                </p>
              </div>
              <div className='space-y-1 rounded-lg bg-white/10 p-2'>
                <p className='text-xs text-white font-medium'>◐ In Progress</p>
                <p className='text-lg font-bold text-white'>
                  {overallProgressData.workInProgress}
                </p>
              </div>
              <div className='space-y-1 rounded-lg bg-white/10 p-2'>
                <p className='text-xs text-white font-medium'>○ Pending</p>
                <p className='text-lg font-bold text-white'>
                  {overallProgressData.yetToComplete}
                </p>
              </div>
            </div>
            <p className='text-xs text-white/70 mt-3 text-center'>
              Total: {overallProgressData.totalUnits} units across {learner?.course?.length || 0} course
              {(learner?.course?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Time Log Card - Compact Version */}
          <div className='flex-1 rounded-lg border border-secondary bg-secondary p-4 shadow-sm flex flex-col justify-center'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-white'>Time Log</h3>
              <Badge variant='secondary' className='rounded-full px-3 py-1 text-sm font-semibold bg-white/10 text-white shadow-sm'>
                24h 57m
              </Badge>
            </div>
            <div className='grid grid-cols-2 gap-4 flex-1 items-center'>
              <div className='text-center space-y-1 border-r border-white/30'>
                <p className='text-xs text-white/70'>On The Job Total</p>
                <p className='text-lg font-bold text-white'>02h 00m</p>
              </div>
              <div className='text-center space-y-1'>
                <p className='text-xs text-white/70'>Off The Job Total</p>
                <p className='text-lg font-bold text-white'>22h 57m</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
