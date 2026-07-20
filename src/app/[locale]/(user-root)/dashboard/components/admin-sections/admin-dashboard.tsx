'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { KeyRound, ShieldCheck, UserCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { AdminDashboardCard } from './admin-dashboard-card'
import { ActiveLearnersDetailDialog } from './active-learners-detail-dialog'
import {
  dashboardCards,
  cardTypeMapping,
  EMPLOYER_DASHBOARD_CARD_IDS,
  type AdminDashboardCardData,
} from '../../data/admin-dashboard-data'
import {
  useGetDashboardCountsQuery,
  useLazyGetCardDataQuery,
} from '@/store/api/dashboard/dashboardApi'
import type {
  DashboardCounts,
  CardApiType,
  ActiveLearnersSummary,
  ActiveLearnersCardDataResponse,
} from '@/store/api/dashboard/types'
import { cardApiTypeToCountKey } from '@/store/api/dashboard/types'
import { useAppSelector } from '@/store/hooks'
import { buildLockerReportCsvRows } from '../../data/locker-report-mapping'
import { buildLearnersOnBilCsv } from '../../utils/learners-on-bil-csv-export'
import { buildOverdueLearnersCsv } from '../../utils/overdue-learners-csv-export'
import { buildOverdueProgressReviewCsv } from '../../utils/overdue-progress-review-csv-export'
import { buildLearnersDueComplete30DaysCsv } from '../../utils/learners-due-complete-30-days-csv-export'
import { buildDefaultReviewOverdueCsv } from '../../utils/default-review-overdue-csv-export'
import { buildSamplingPlanOverdueCsv } from '../../utils/sampling-plan-overdue-csv-export'
import { buildAssignmentsWithoutMappedCsv } from '../../utils/assignments-without-mapped-csv-export'
import { buildUnmappedEvidenceCsv } from '../../utils/unmapped-evidence-csv-export'
import { buildSessionLearnerActionCsv } from '../../utils/session-learner-action-csv-export'
import { buildIqaActionsCsv } from '../../utils/iqa-actions-csv-export'
import { buildTrainerRiskRatingCsv } from '../../utils/trainer-risk-rating-csv-export'
import { buildGatewayLearnersCsv } from '../../utils/gateway-learners-csv-export'
import { buildLearnersOffTrackCsv } from '../../utils/learners-off-track-csv-export'

const SHEET_CSV_BUILDERS: Record<
  string,
  (rows: Record<string, unknown>[]) => string
> = {
  suspended_learners: buildLearnersOnBilCsv,
  learners_over_due: buildOverdueLearnersCsv,
  learner_plan_due: buildOverdueProgressReviewCsv,
  learner_plan_due_in_next_7_days: buildOverdueProgressReviewCsv,
  learners_course_due_in_next_30_days: buildLearnersDueComplete30DaysCsv,
  default_review_overdue: buildDefaultReviewOverdueCsv,
  assignments_without_mapped: buildAssignmentsWithoutMappedCsv,
  unmapped_evidence: buildUnmappedEvidenceCsv,
  session_learner_action_due: buildSessionLearnerActionCsv,
  session_action_due_in_next_7_days: buildSessionLearnerActionCsv,
  session_learner_action_overdue: buildSessionLearnerActionCsv,
  iqa_actions_overdue: buildIqaActionsCsv,
  all_iqa_actions: buildIqaActionsCsv,
  iqa_actions_due_in_30_days: buildIqaActionsCsv,
  session_due_today: buildOverdueProgressReviewCsv,
  session_due_in_7_days: buildOverdueProgressReviewCsv,
  sample_due_in_month: buildSamplingPlanOverdueCsv,
  sampling_plan_overdue: buildSamplingPlanOverdueCsv,
  risk_ratings: buildTrainerRiskRatingCsv,
  gateway_learners: buildGatewayLearnersCsv,
  off_track_learners: buildLearnersOffTrackCsv,
}

function extractCardDataArray(res: unknown): unknown[] {
  if (!res || typeof res !== 'object') return []

  const record = res as Record<string, unknown>

  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.learners)) return record.learners
  if (Array.isArray(record.list)) return record.list

  const arrayValue = Object.values(record).find((v) => Array.isArray(v))
  return arrayValue ? (arrayValue as unknown[]) : []
}

/* ============================================================
   THEME-ADAPTIVE CARD BACKGROUNDS
============================================================ */

// Theme-adaptive card backgrounds – follows active theme automatically
const cardBgColors = [
  'border bg-primary',
  'border bg-secondary',
  'border bg-accent',
  'border bg-primary',
  'border bg-muted-foreground',
  'border bg-secondary',
  'border bg-accent',
  'border bg-primary',
  'border bg-secondary',
  'border bg-accent',
]

const LICENSE_KPI_CARDS: Array<{
  id: 'total_licenses' | 'total_license_used' | 'total_license_remaining'
  countKey: keyof Pick<
    DashboardCounts,
    'totalLicenses' | 'totalLicenseUsed' | 'totalLicenseRemaining'
  >
  className: string
  icon: LucideIcon
}> = [
  {
    id: 'total_licenses',
    countKey: 'totalLicenses',
    className:
      'bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 text-white ring-violet-400/60 shadow-violet-900/40',
    icon: KeyRound,
  },
  {
    id: 'total_license_used',
    countKey: 'totalLicenseUsed',
    className:
      'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-800 text-white ring-orange-300/70 shadow-orange-900/40',
    icon: Users,
  },
  {
    id: 'total_license_remaining',
    countKey: 'totalLicenseRemaining',
    className:
      'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-900 text-white ring-emerald-400/60 shadow-emerald-900/40',
    icon: UserCheck,
  },
]

/* ============================================================
   COMPONENT
============================================================ */

export function AdminDashboard() {
  const t = useTranslations('dashboard')
  const tAdmin = useTranslations('dashboard.admin')
  const userRole = useAppSelector((state) => state.auth.user?.role)
  const isAdmin = userRole === 'Admin'

  const { data: dashboardData, isLoading: loading ,isFetching } =
    useGetDashboardCountsQuery(undefined, {
      skip: !userRole || userRole === 'Learner',
      refetchOnMountOrArgChange: true,
    })

  const [getCardData] = useLazyGetCardDataQuery()
  const [exporting, setExporting] = useState<Record<string, boolean>>({})

  const [activeLearnersDialog, setActiveLearnersDialog] = useState<{
    open: boolean
    summary?: ActiveLearnersSummary | null
  }>({ open: false, summary: null })

  const counts: DashboardCounts = dashboardData?.data || ({} as DashboardCounts)

  const cardsWithoutOverall = dashboardCards.filter(
    (card) => card.id !== 'overall_progress',
  )
  const cardsToRender: AdminDashboardCardData[] =
    userRole === 'Employer'
      ? EMPLOYER_DASHBOARD_CARD_IDS.map((id) =>
          cardsWithoutOverall.find((c) => c.id === id),
        ).filter((c): c is AdminDashboardCardData => c != null)
      : cardsWithoutOverall

  /* ============================================================
     EXPORT HANDLER
  ============================================================ */

  const handleExport = async (apiType: string, cardId: string) => {
    setExporting((prev) => ({ ...prev, [apiType]: true }))

    try {
      const response = await getCardData(apiType).unwrap()
      const res = response as ActiveLearnersCardDataResponse
      const data = extractCardDataArray(res)
      const recordData = data as Record<string, unknown>[]
      const summary = res.summary
      const csvParts: string[] = []

      /* -------- Add summary if exists -------- */
      if (apiType === 'active_learners' && summary) {
        const summaryRows: string[] = []

        if (summary.sa_unmapped_evidence_count !== undefined) {
          summaryRows.push(
            `${tAdmin('summarySaUnmapped')},${summary.sa_unmapped_evidence_count}`,
          )
        }

        if (summary.outstanding_iqa_actions_count !== undefined) {
          summaryRows.push(
            `${tAdmin('summaryOutstandingIqa')},${summary.outstanding_iqa_actions_count}`,
          )
        }

        if (summaryRows.length > 0) {
          csvParts.push(summaryRows.join('\n'), '')
        }
      }

      /* -------- Data rows -------- */
      const sheetBuilder = SHEET_CSV_BUILDERS[apiType]

      if (apiType === 'active_learners') {
        const { headers, dataRows } = buildLockerReportCsvRows(recordData)
        csvParts.push(headers, ...dataRows)
      } else if (sheetBuilder) {
        csvParts.push(sheetBuilder(recordData))
      }

      /* Ensure a file is always generated (e.g. when data and summary are empty). */
      if (csvParts.length === 0) {
        csvParts.push(`"Report","${tAdmin('csvNoData')}"`)
      }

      /* -------- Generate File -------- */
      if (csvParts.length > 0) {
        const blob = new Blob([csvParts.join('\n')], {
          type: 'text/csv;charset=utf-8;',
        })

        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.href = url
        link.download = `${cardId}_${
          new Date().toISOString().split('T')[0]
        }.csv`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error(`Failed to export ${apiType}:`, error)
    } finally {
      setExporting((prev) => ({ ...prev, [apiType]: false }))
    }
  }

  const dashboardTitle =
    isAdmin ? t('adminDashboard') : t('dashboard')

  return (
    <div className='flex flex-col gap-6'>
      <div className='px-4 lg:px-6'>
        <PageHeader title={dashboardTitle} icon={ShieldCheck} />
      </div>

      {isAdmin ? (
        <div className='px-4 lg:px-6'>
          <section
            aria-label={tAdmin('licenseOverview')}
            className='rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-md sm:p-5'
          >
            <h2 className='mb-3 text-xs font-bold uppercase tracking-widest text-primary'>
              {tAdmin('licenseOverview')}
            </h2>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              {LICENSE_KPI_CARDS.map((kpi) => (
                <AdminDashboardCard
                  key={kpi.id}
                  variant='license'
                  title={tAdmin(`cards.${kpi.id}`)}
                  count={loading || isFetching ? '...' : counts[kpi.countKey] ?? 0}
                  textColor='#ffffff'
                  radiusColor='rgba(255, 255, 255, 0.3)'
                  icon={kpi.icon}
                  className={kpi.className}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <div className='px-4 lg:px-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          {cardsToRender.map((card, index) => {
              const apiType: CardApiType | string | undefined =
                card.apiType || cardTypeMapping[card.title]

              const countKey =
                apiType && apiType in cardApiTypeToCountKey
                  ? cardApiTypeToCountKey[apiType as CardApiType]
                  : apiType

              const count =
                apiType && countKey && counts[countKey] !== undefined
                  ? counts[countKey]?.toString()
                  : card.name || '0'

              const displayCount = loading || isFetching ? '...' : count
              const isExporting = apiType ? exporting[apiType] || false : false

              const showExport = Boolean(
                apiType &&
                countKey &&
                counts[countKey] !== undefined &&
                counts[countKey]! > 0,
              )

              return (
                <AdminDashboardCard
                  key={card.id}
                  title={tAdmin('cards.' + card.id)}
                  count={displayCount}
                  textColor={card.textColor}
                  radiusColor={card.radiusColor}
                  onExport={
                    apiType
                      ? () => handleExport(apiType, card.id)
                      : undefined
                  }
                  isExporting={isExporting}
                  showExport={showExport}
                  className={cardBgColors[index % cardBgColors.length]}
                />
              )
            })}
        </div>
      </div>

      <ActiveLearnersDetailDialog
        open={activeLearnersDialog.open}
        onOpenChange={(open) =>
          setActiveLearnersDialog((prev) => ({ ...prev, open }))
        }
        title={tAdmin('cards.active_learner')}
        count={counts.active_learners_count ?? '0'}
        summary={activeLearnersDialog.summary}
      />
    </div>
  )
}
