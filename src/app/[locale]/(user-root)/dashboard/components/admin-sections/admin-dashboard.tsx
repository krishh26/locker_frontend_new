'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { AdminDashboardCard } from './admin-dashboard-card'
import { ActiveLearnersDetailDialog } from './active-learners-detail-dialog'
import {
  dashboardCards,
  cardTypeMapping,
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

/* ============================================================
   CSV HEADER MAPPING
============================================================ */

const CSV_HEADER_NAMES: Record<string, string> = {
  learner_id: 'Learner ID',
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  course_name: 'Course Name',
  start_date: 'Start Date',
  planned_end_date: 'Planned End Date',
  overall_progress: 'Overall Progress (%)',
  timeline_progress: 'Timeline Progress (%)',
  overdue: 'Overdue',
  on_track: 'On Track',
  course_status: 'Course Status',
}

/** Keys to strip from CSV export (file paths and similar). */
const FILE_PATH_HEADERS_BLOCKLIST = [
  'file_path',
  'filePath',
  'file_path_link',
  'file_path_url',
]

/* ============================================================
   SAFE HELPERS
============================================================ */

const parsePercentage = (value: unknown): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    return Number(value.replace('%', '').trim()) || 0
  }
  return 0
}

/* ============================================================
   FLATTEN + COMPUTED FIELDS
============================================================ */

function flattenRowForCsv(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const today = new Date()

  const startDateRaw = row.registration_date as string
  const endDateRaw = row.course_expected_end_date as string

  let timelineProgress = 0

  if (startDateRaw && endDateRaw) {
    const startDate = new Date(startDateRaw)
    const endDate = new Date(endDateRaw)

    const totalDuration =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    const daysPassed =
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    if (totalDuration > 0) {
      timelineProgress = Math.min(
        100,
        Math.max(0, (daysPassed / totalDuration) * 100),
      )
    }
  }

  /* -------- OVERDUE -------- */
  let overdue = 'No'
  if (endDateRaw) {
    const endDate = new Date(endDateRaw)
    if (!isNaN(endDate.getTime()) && today > endDate) {
      overdue = 'Yes'
    }
  }

  /* -------- OVERALL PROGRESS -------- */
  const overallProgress = parsePercentage(
    row.main_aim_green_progress ?? 0,
  )

  /* -------- ON TRACK -------- */
  const onTrack =
    overallProgress >= timelineProgress ? 'Yes' : 'No'

  return {
    learner_id: row.learner_id ?? '',
    first_name: row.first_name ?? '',
    last_name: row.last_name ?? '',
    email: row.email ?? '',

    course_name: row.curriculum_area ?? '',
    start_date: startDateRaw ?? '',
    planned_end_date: endDateRaw ?? '',

    overall_progress: Math.round(overallProgress),
    timeline_progress: Math.round(timelineProgress),

    overdue: overdue,
    on_track: onTrack,

    course_status:
      (row.user_id as Record<string, unknown>)?.status ?? '',
  }
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

/* ============================================================
   COMPONENT
============================================================ */

export function AdminDashboard() {
  const t = useTranslations('dashboard')
  const userRole = useAppSelector((state) => state.auth.user?.role)

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

  /* ============================================================
     EXPORT HANDLER
  ============================================================ */

  const handleExport = async (apiType: string, title: string) => {
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

      // DEBUG: remove after verifying active_learners export
      if (apiType === 'active_learners') {
        console.debug('[active_learners export]', {
          keys: Object.keys(res),
          dataIsArray: Array.isArray(res.data),
          dataLength: data.length,
        })
      }

      const summary = res.summary
      const csvParts: string[] = []

      /* -------- Add summary if exists -------- */
      if (apiType === 'active_learners' && summary) {
        const summaryRows: string[] = []

        if (summary.sa_unmapped_evidence_count !== undefined) {
          summaryRows.push(
            `SA + unmapped evidence,${summary.sa_unmapped_evidence_count}`,
          )
        }

        if (summary.outstanding_iqa_actions_count !== undefined) {
          summaryRows.push(
            `Outstanding IQA actions,${summary.outstanding_iqa_actions_count}`,
          )
        }

        if (summaryRows.length > 0) {
          csvParts.push(summaryRows.join('\n'), '')
        }
      }

      /* -------- Data rows -------- */
      if (Array.isArray(data) && data.length > 0) {
        const flatRows = data.map((row) =>
          flattenRowForCsv({ ...(row as Record<string, unknown>) }),
        )

        const rawHeaders = Object.keys(flatRows[0])
        const filteredHeaders = rawHeaders.filter(
          (h) => !FILE_PATH_HEADERS_BLOCKLIST.includes(h),
        )
        const headers = filteredHeaders.map(
          (h) =>
            CSV_HEADER_NAMES[h] ??
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

      /* Ensure a file is always generated (e.g. when data and summary are empty). */
      if (csvParts.length === 0) {
        csvParts.push('"Report","No data"')
      }

      /* -------- Generate File -------- */
      if (csvParts.length > 0) {
        const blob = new Blob([csvParts.join('\n')], {
          type: 'text/csv;charset=utf-8;',
        })

        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.href = url
        link.download = `${title.replace(/\s+/g, '_')}_${
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
    userRole === 'Admin' ? t('adminDashboard') : t('dashboard')

  return (
    <div className='flex flex-col gap-6'>
      <div className='px-4 lg:px-6'>
        <PageHeader title={dashboardTitle} icon={ShieldCheck} />
      </div>

      <div className='px-4 lg:px-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          {dashboardCards
            .filter((card) => card.id !== 'overall_progress')
            .map((card, index) => {
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
                  title={card.title}
                  count={displayCount}
                  textColor={card.textColor}
                  radiusColor={card.radiusColor}
                  onExport={
                    apiType
                      ? () => handleExport(apiType, card.title)
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
        title='Active Learner'
        count={counts.active_learners_count ?? '0'}
        summary={activeLearnersDialog.summary}
      />
    </div>
  )
}
