'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { KeyRound, ShieldCheck, UserCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { AdminDashboardCard } from './admin-dashboard-card'
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
  ActiveLearnersCardDataResponse,
  ActiveLearnersSummary,
} from '@/store/api/dashboard/types'
import { cardApiTypeToCountKey } from '@/store/api/dashboard/types'
import { useAppSelector } from '@/store/hooks'
import { buildLearnersOnBilCsv } from '../../utils/learners-on-bil-csv-export'
import { buildOverdueProgressReviewCsv } from '../../utils/overdue-progress-review-csv-export'
import { buildDefaultReviewOverdueCsv } from '../../utils/default-review-overdue-csv-export'
import { buildSamplingPlanOverdueCsv } from '../../utils/sampling-plan-overdue-csv-export'
import { buildAssignmentsWithoutMappedCsv } from '../../utils/assignments-without-mapped-csv-export'
import { buildIqaActionsCsv } from '../../utils/iqa-actions-csv-export'
import { buildGatewayLearnersCsv } from '../../utils/gateway-learners-csv-export'
import {
  getReportConfigByApiType,
  getReportConfigByCardId,
} from '../../reports/configs'
import {
  extractCardDataArray,
  processReportResponse,
} from '../../reports/lib/process-report-response'
import { ReportDialog } from '../../reports/components/report-dialog'
import type { ReportConfig } from '../../reports/types'

/** Legacy CSV builders for tiles not yet on the shared report architecture. */
const LEGACY_SHEET_CSV_BUILDERS: Record<
  string,
  (rows: Record<string, unknown>[]) => string
> = {
  suspended_learners: buildLearnersOnBilCsv,
  learner_plan_due_in_next_7_days: buildOverdueProgressReviewCsv,
  default_review_overdue: buildDefaultReviewOverdueCsv,
  assignments_without_mapped: buildAssignmentsWithoutMappedCsv,
  iqa_actions_overdue: buildIqaActionsCsv,
  all_iqa_actions: buildIqaActionsCsv,
  iqa_actions_due_in_30_days: buildIqaActionsCsv,
  sample_due_in_month: buildSamplingPlanOverdueCsv,
  sampling_plan_overdue: buildSamplingPlanOverdueCsv,
  gateway_learners: buildGatewayLearnersCsv,
}

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

function downloadBlob(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function AdminDashboard() {
  const t = useTranslations('dashboard')
  const tAdmin = useTranslations('dashboard.admin')
  const userRole = useAppSelector((state) => state.auth.user?.role)
  const isAdmin = userRole === 'Admin'

  const { data: dashboardData, isLoading: loading, isFetching } =
    useGetDashboardCountsQuery(undefined, {
      skip: !userRole || userRole === 'Learner',
      refetchOnMountOrArgChange: true,
    })

  const [getCardData] = useLazyGetCardDataQuery()
  const [exporting, setExporting] = useState<Record<string, boolean>>({})

  const [reportDialog, setReportDialog] = useState<{
    open: boolean
    config: ReportConfig | null
    title: string
  }>({ open: false, config: null, title: '' })

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

  const buildActiveLearnersSummaryLines = useCallback(
    (response: unknown): string[] => {
      const summary = (response as ActiveLearnersCardDataResponse)?.summary as
        | ActiveLearnersSummary
        | undefined
      if (!summary) return []

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
      return summaryRows
    },
    [tAdmin],
  )

  const handleExport = async (apiType: string, cardId: string) => {
    setExporting((prev) => ({ ...prev, [apiType]: true }))

    try {
      const response = await getCardData(apiType).unwrap()
      const filename = `${cardId}_${new Date().toISOString().split('T')[0]}.csv`

      const sharedConfig =
        getReportConfigByCardId(cardId) ?? getReportConfigByApiType(apiType)

      if (sharedConfig) {
        const summaryLines =
          apiType === 'active_learners'
            ? buildActiveLearnersSummaryLines(response)
            : []
        const { csv } = processReportResponse(
          {
            ...sharedConfig,
            buildSummaryLines: summaryLines.length
              ? () => summaryLines
              : undefined,
          },
          response,
        )
        downloadBlob(csv || `"Report","${tAdmin('csvNoData')}"`, filename)
        return
      }

      const res = response as ActiveLearnersCardDataResponse
      const data = extractCardDataArray(res) as Record<string, unknown>[]
      const sheetBuilder = LEGACY_SHEET_CSV_BUILDERS[apiType]
      const csvParts: string[] = []

      if (sheetBuilder) {
        csvParts.push(sheetBuilder(data))
      }

      if (csvParts.length === 0) {
        csvParts.push(`"Report","${tAdmin('csvNoData')}"`)
      }

      downloadBlob(csvParts.join('\n'), filename)
    } catch (error) {
      console.error(`Failed to export ${apiType}:`, error)
    } finally {
      setExporting((prev) => ({ ...prev, [apiType]: false }))
    }
  }

  const handleOpenReport = (card: AdminDashboardCardData) => {
    const config = getReportConfigByCardId(card.id)
    if (!config?.apiType) return

    setReportDialog({
      open: true,
      config,
      title: tAdmin('cards.' + card.id),
    })
  }

  const dashboardTitle = isAdmin ? t('adminDashboard') : t('dashboard')

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
                  count={
                    loading || isFetching ? '...' : counts[kpi.countKey] ?? 0
                  }
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
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
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
            const showExport =
              loading || isFetching ? false : Boolean(apiType)
            const reportConfig = getReportConfigByCardId(card.id)
            const canOpenReport = Boolean(reportConfig?.apiType)

            return (
              <AdminDashboardCard
                key={card.id}
                title={tAdmin('cards.' + card.id)}
                count={displayCount}
                textColor={card.textColor}
                radiusColor={card.radiusColor}
                onClick={
                  canOpenReport ? () => handleOpenReport(card) : undefined
                }
                onExport={
                  apiType ? () => handleExport(apiType, card.id) : undefined
                }
                isExporting={isExporting}
                showExport={showExport}
                className={cardBgColors[index % cardBgColors.length]}
              />
            )
          })}
        </div>
      </div>

      <ReportDialog
        open={reportDialog.open}
        onOpenChange={(open) =>
          setReportDialog((prev) => ({ ...prev, open }))
        }
        config={reportDialog.config}
        title={reportDialog.title}
        buildSummaryLines={
          reportDialog.config?.apiType === 'active_learners'
            ? buildActiveLearnersSummaryLines
            : undefined
        }
      />
    </div>
  )
}
