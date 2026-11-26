'use client'

import { useMemo, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  User,
  MessageSquare,
  Edit,
  LayoutDashboard,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { getRandomColor } from '@/app/[locale]/(learner-root)/forum/utils/randomColor'
import {
  useGetLearnerDetailsQuery,
  useUpdateLearnerCommentMutation,
} from '@/store/api/learner/learnerApi'
import type { LearnerCourse, LearnerListItem } from '@/store/api/learner/types'
import { calculateLearnerProgress } from '@/lib/learner-progress-utils'
import { isCourseEligibleForOverallProgress } from '@/lib/is-enrollment-excluded'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface LearnerPortfolioCardProps {
  learner: LearnerListItem
  onCommentUpdate: () => void
}

export function LearnerPortfolioCard({
  learner,
  onCommentUpdate,
}: LearnerPortfolioCardProps) {
  const t = useTranslations('learnerOverview')
  const progressT = useTranslations('learnerDashboard.infoCard.overallProgress')
  const router = useRouter()
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [editedComment, setEditedComment] = useState('')
  const [updateComment, { isLoading: isSavingComment }] =
    useUpdateLearnerCommentMutation()

  const learnerId = learner?.learner_id
  const { data: learnerDetailsResponse } = useGetLearnerDetailsQuery(
    learnerId,
    {
      skip: !learnerId,
    },
  )
  const learnerDetails = learnerDetailsResponse?.data

  const overallProgressData = useMemo(() => {
    const coursesForProgress = (
      learnerDetails?.course ??
      learner?.course ??
      []
    ).filter((c) => isCourseEligibleForOverallProgress(c))

    if (coursesForProgress.length === 0) {
      return {
        totalCompleted: 0,
        totalInProgress: 0,
        totalNotStarted: 0,
        totalUnits: 0,
        completionPercentage: 0,
        countedCourses: 0,
      }
    }

    const progressLearner: LearnerListItem = {
      learner_id: Number(learnerDetails?.learner_id ?? learner.learner_id),
      user_name: String(learnerDetails?.user_name ?? learner.user_name ?? ''),
      first_name: String(
        learnerDetails?.first_name ?? learner.first_name ?? '',
      ),
      last_name: String(learnerDetails?.last_name ?? learner.last_name ?? ''),
      email: String(learnerDetails?.email ?? learner.email ?? ''),
      mobile: String(learnerDetails?.mobile ?? learner.mobile ?? ''),
      course: coursesForProgress as LearnerCourse[],
    }

    const summary = calculateLearnerProgress(progressLearner)

    return {
      ...summary,
      countedCourses: coursesForProgress.length,
    }
  }, [learner, learnerDetails])

  const handleOpenCommentDialog = () => {
    setIsEditingComment(true)
    setEditedComment(learner?.comment || '')
  }

  const handleCloseCommentDialog = () => {
    setIsEditingComment(false)
    setEditedComment('')
  }

  const handleSaveComment = async () => {
    try {
      await updateComment({
        id: learner.learner_id,
        data: { comment: editedComment },
      }).unwrap()
      toast.success(t('card.commentUpdatedSuccess'))
      onCommentUpdate()
      handleCloseCommentDialog()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined
      toast.error(errorMessage || t('card.commentUpdateFailed'))
    }
  }

  const avatarColor = getRandomColor(
    learner?.first_name?.toLowerCase().charAt(0),
  )
  const initials = `${learner?.first_name?.charAt(0) || ''}${
    learner?.last_name?.charAt(0) || ''
  }`.toUpperCase()

  return (
    <>
      <Card className='py-0 transition-shadow hover:shadow-md'>
        <CardContent className='p-3 sm:px-4'>
          <div className='flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6'>
            {/* Learner info */}
            <div className='flex min-w-0 items-center gap-3 lg:w-[34%] lg:shrink-0'>
              <Avatar
                className='h-10 w-10 shrink-0'
                style={{ backgroundColor: avatarColor }}
              >
                <AvatarImage
                  src={
                    (
                      learner as LearnerListItem & {
                        avatar?: { url?: string }
                        user_id?: { avatar?: { url?: string } }
                      }
                    )?.avatar?.url ||
                    (
                      learner as LearnerListItem & {
                        user_id?: { avatar?: { url?: string } }
                      }
                    )?.user_id?.avatar?.url
                  }
                  alt={initials}
                />
                <AvatarFallback className='text-sm font-semibold'>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className='min-w-0 flex-1'>
                <h3 className='truncate text-sm sm:text-base font-semibold leading-tight'>
                  {learner?.first_name} {learner?.last_name}
                </h3>
                <div className='mt-0.5 flex min-w-0 items-center gap-3 text-xs text-muted-foreground'>
                  <span className='flex shrink-0 items-center gap-1'>
                    <User className='h-3.5 w-3.5 text-primary' />
                    {learner?.learner_id}
                  </span>
                  <span className='flex min-w-0 items-center gap-1'>
                    <MessageSquare className='h-3.5 w-3.5 shrink-0 text-blue-500' />
                    <span className='truncate' title={learner?.comment || ''}>
                      {learner?.comment || t('card.noComment')}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-5 w-5 shrink-0'
                      onClick={handleOpenCommentDialog}
                      aria-label={t('card.editCommentTitle')}
                    >
                      <Edit className='h-3 w-3 text-blue-500' />
                    </Button>
                  </span>
                </div>
              </div>
            </div>

            {/* Overall progress */}
            <div className='min-w-0 flex-1'>
              <div className='mb-1 flex items-center justify-between gap-2'>
                <span className='text-xs font-semibold text-primary'>
                  {t('card.overallProgress')}
                </span>
                <span className='text-xs font-bold text-primary'>
                  {overallProgressData.completionPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(overallProgressData.completionPercentage, 100)}
                className='h-2'
              />
              <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground'>
                <span>
                  {progressT('completed')}:{' '}
                  <b className='text-success'>
                    {overallProgressData.totalCompleted}
                  </b>
                </span>
                <span>
                  {progressT('inProgress')}:{' '}
                  <b className='text-warning'>
                    {overallProgressData.totalInProgress}
                  </b>
                </span>
                <span>
                  {progressT('pending')}:{' '}
                  <b className='text-foreground'>
                    {overallProgressData.totalNotStarted}
                  </b>
                </span>
                <span className='sm:ml-auto'>
                  {progressT('totalUnits', {
                    units: overallProgressData.totalUnits,
                    courses: overallProgressData.countedCourses,
                  })}
                </span>
              </div>
            </div>

            {/* Action */}
            <Button
              onClick={() => {
                if (learner?.learner_id) {
                  router.push(`/learner-dashboard/${learner.learner_id}`)
                }
              }}
              className='w-full lg:w-auto lg:shrink-0'
              size='sm'
              disabled={!learner?.learner_id}
            >
              <LayoutDashboard className='mr-1.5 h-4 w-4' />
              {t('card.viewPortfolio')}
              <ArrowRight className='ml-1.5 h-4 w-4' />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditingComment} onOpenChange={setIsEditingComment}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('card.editCommentTitle')}</DialogTitle>
            <DialogDescription>
              {t('card.editCommentDescription', {
                name:
                  `${learner?.first_name ?? ''} ${learner?.last_name ?? ''}`.trim() ||
                  '—',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='comment'>{t('card.commentLabel')}</Label>
              <Textarea
                id='comment'
                placeholder={t('card.commentPlaceholder')}
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                rows={4}
                className='resize-none'
                disabled={isSavingComment}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleCloseCommentDialog}
              disabled={isSavingComment}
            >
              {t('card.cancel')}
            </Button>
            <Button onClick={handleSaveComment} disabled={isSavingComment}>
              {isSavingComment && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isSavingComment ? t('card.saving') : t('card.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
