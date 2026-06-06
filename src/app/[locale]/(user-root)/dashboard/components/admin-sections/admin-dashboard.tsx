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

/** Keys to strip from generic CSV export (file paths and similar). */
const FILE_PATH_HEADERS_BLOCKLIST = [
  'file_path',
  'filePath',
  'file_path_link',
  'file_path_url',
]

function genericFlattenRowForCsv(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const flat: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(row)) {
    if (FILE_PATH_HEADERS_BLOCKLIST.includes(key)) continue

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      flat[key] = JSON.stringify(value)
    } else {
      flat[key] = value ?? ''
    }
  }

  return flat
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

  const { data: dashboardData, isLoading: loading } =
    useGetDashboardCountsQuery(undefined, {
      skip: !userRole || userRole === 'Learner',
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

      /* Backend for active_learners should return { status, data: [] | [...] } (or learners/list).
         Optional summary: { sa_unmapped_evidence_count?, outstanding_iqa_actions_count?, ... }. */
      let data: unknown[] = []
      if (Array.isArray(res.data)) {
        data = res.data
      } else if (
        Array.isArray((res as unknown as Record<string, unknown>).learners)
      ) {
        data = (res as unknown as Record<string, unknown>).learners as unknown[]
      } else if (
        Array.isArray((res as unknown as Record<string, unknown>).list)
      ) {
        data = (res as unknown as Record<string, unknown>).list as unknown[]
      } else {
        const values = Object.values(res as unknown as Record<string, unknown>)
        const arrayValue = values.find((v) => Array.isArray(v))
        if (arrayValue) data = arrayValue as unknown[]
      }

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
      if (Array.isArray(data) && data.length > 0) {
        if (apiType === 'active_learners') {
          const { headers, dataRows } = buildLockerReportCsvRows(
            data as Record<string, unknown>[],
          )
          csvParts.push(headers, ...dataRows)
        } else {
          const flatRows = data.map((row) =>
            genericFlattenRowForCsv({
              ...(row as Record<string, unknown>),
            }),
          )

          const rawHeaders = Object.keys(flatRows[0])
          const filteredHeaders = rawHeaders.filter(
            (h) => !FILE_PATH_HEADERS_BLOCKLIST.includes(h),
          )
          const headers = filteredHeaders.map(
            (h) =>
              (tAdmin as (key: string) => string)('csvHeaders.' + h) ||
              h.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          )

          const csvHeaders = headers
            .map((h) => `"${h.replace(/"/g, '""')}"`)
            .join(',')

          const csvRows = flatRows.map((row) =>
            filteredHeaders
              .map((header) => {
                const value = row[header]
                if (value === null || value === undefined) return '""'
                const str =
                  value instanceof Date ? value.toISOString() : String(value)
                return `"${str.replace(/"/g, '""')}"`
              })
              .join(','),
          )

          csvParts.push(csvHeaders, ...csvRows)
        }
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
                  count={loading ? '...' : counts[kpi.countKey] ?? 0}
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

              const displayCount = loading ? '...' : count
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
