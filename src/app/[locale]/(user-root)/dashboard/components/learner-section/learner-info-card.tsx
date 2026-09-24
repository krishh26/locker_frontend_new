'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'
import { isCourseEligibleForOverallProgress } from '@/lib/is-enrollment-excluded'
import { calculateLearnerProgress } from '@/lib/learner-progress-utils'
import type { LearnerCourse, LearnerListItem } from '@/store/api/learner/types'

interface Learner {
  learner_id?: string | number
  first_name?: string
  last_name?: string
  email?: string
  avatar?: string
  user_name?: string
  nextvisitdate?: string
  next_visit_date?: string | null
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
      is_excluded?: boolean
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
    is_excluded?: boolean
  }>
}

interface User {
  id?: string | number
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

function formatNextVisitDate(
  dateString: string | undefined | null,
  locale: string,
): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LearnerInfoCard({ learner, user }: LearnerInfoCardProps) {
  const t = useTranslations('learnerDashboard.infoCard')
  const locale = useLocale()

  const formattedNextVisit = useMemo(
    () =>
      formatNextVisitDate(
        learner?.nextvisitdate ?? learner?.next_visit_date,
        locale,
      ),
    [learner?.nextvisitdate, learner?.next_visit_date, locale],
  )

  // Calculate overall progress across all courses
  const overallProgressData = useMemo(() => {
    const coursesForProgress = (learner?.course ?? []).filter((c) =>
      isCourseEligibleForOverallProgress(c),
    )

    if (coursesForProgress.length === 0) {
      return {
        yetToComplete: 0,
        fullyCompleted: 0,
        workInProgress: 0,
        totalUnits: 0,
        completionPercentage: 0,
        countedCourses: 0,
      }
    }

    const stub: LearnerListItem = {
      learner_id: Number(learner.learner_id ?? 0),
      user_name: String(learner.user_name ?? ''),
      first_name: String(learner.first_name ?? ''),
      last_name: String(learner.last_name ?? ''),
      email: String(learner.email ?? ''),
      mobile: String((learner as { mobile?: string }).mobile ?? ''),
      course: coursesForProgress as LearnerCourse[],
    }
    const summary = calculateLearnerProgress(stub)

    return {
      yetToComplete: summary.totalNotStarted,
      fullyCompleted: summary.totalCompleted,
      workInProgress: summary.totalInProgress,
      totalUnits: summary.totalUnits,
      completionPercentage: summary.completionPercentage,
      countedCourses: coursesForProgress.length,
    }
  }, [learner])

  const learnerName = learner
    ? `${learner.first_name || ''} ${learner.last_name || ''}`.trim()
    : user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : t('fallbackLearnerName')

  const primaryCourse =
    learner?.course?.find((c) => isCourseEligibleForOverallProgress(c)) ??
    learner?.course?.[0]

  const trainerName = primaryCourse?.trainer_id
    ? `${primaryCourse.trainer_id.first_name} ${primaryCourse.trainer_id.last_name}`
    : t('notAvailable')

  const iqaName = primaryCourse?.IQA_id
    ? `${primaryCourse.IQA_id.first_name} ${primaryCourse.IQA_id.last_name}`
    : t('notAvailable')

  const completion = Math.min(
    Math.max(overallProgressData.completionPercentage, 0),
    100
  )

 
  return (
    <Card className='overflow-hidden border border-border/60 shadow-sm gap-0 py-2.5'>
      <div className='flex flex-col gap-2 px-3 xl:flex-row xl:items-center xl:gap-3'>
        {/* Profile info — single row */}
        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <h2 className='truncate text-base font-semibold text-foreground'>
              {learnerName}
            </h2>
            <Link
              href={`/learner-profile?learner_id=${String(
                learner?.learner_id || ''
              )}`}
              className='inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80'
            >
              {t('viewProfile')}
              <ArrowRight className='size-3.5' />
            </Link>
          </div>

          <div className='flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs'>
            <span className='text-muted-foreground'>{t('trainerLabel')}</span>
            <span className='font-medium text-foreground'>{trainerName}</span>
          </div>

          <div className='flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs'>
            <span className='text-muted-foreground'>{t('iqaLabel')}</span>
            <span className='font-medium text-foreground'>{iqaName}</span>
          </div>

          <Badge
            variant='outline'
            className='w-fit shrink-0 rounded-full border-primary bg-primary px-2.5 py-1 text-xs text-white shadow-sm'
          >
            {t('nextVisit')} {formattedNextVisit ?? t('notAvailable')}
          </Badge>
        </div>

        {/* Overall Progress — single compact row */}
        <div className='flex min-w-0 shrink-0 items-center gap-2 rounded-lg border border-accent bg-accent px-2.5 py-2 shadow-sm xl:max-w-[520px]'>
          <div className='flex shrink-0 items-center gap-1.5'>
            <h3 className='whitespace-nowrap text-xs font-semibold text-white'>
              {t('overallProgress.title')}
            </h3>
            <Badge
              variant='outline'
              className={cn(
                'rounded-full px-1.5 py-0 text-[10px] font-semibold shadow-sm',
                'border-white/30 bg-white/10 text-white'
              )}
            >
              {completion.toFixed(0)}%
            </Badge>
          </div>

          <Progress value={completion} className='h-1.5 w-16 shrink-0 sm:w-20' />

          <div className='flex items-center gap-1.5'>
            <div className='rounded-md bg-white/10 px-1.5 py-1 text-center'>
              <p className='text-[9px] font-medium leading-tight text-white/80'>
                {t('overallProgress.completed')}
              </p>
              <p className='text-xs font-bold text-white'>
                {overallProgressData.fullyCompleted}
              </p>
            </div>
            <div className='rounded-md bg-white/10 px-1.5 py-1 text-center'>
              <p className='text-[9px] font-medium leading-tight text-white/80'>
                {t('overallProgress.inProgress')}
              </p>
              <p className='text-xs font-bold text-white'>
                {overallProgressData.workInProgress}
              </p>
            </div>
            <div className='rounded-md bg-white/10 px-1.5 py-1 text-center'>
              <p className='text-[9px] font-medium leading-tight text-white/80'>
                {t('overallProgress.pending')}
              </p>
              <p className='text-xs font-bold text-white'>
                {overallProgressData.yetToComplete}
              </p>
            </div>
          </div>

          <p className='hidden text-[10px] leading-tight text-white/70 sm:block'>
            {t('overallProgress.totalUnits', {
              units: overallProgressData.totalUnits,
              courses: overallProgressData.countedCourses,
            })}
          </p>
        </div>
      </div>
    </Card>
  )
}
