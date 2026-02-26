"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { AdminDashboardCard } from "./admin-dashboard-card"
import { ActiveLearnersDetailDialog } from "./active-learners-detail-dialog"
import { dashboardCards, cardTypeMapping } from "../../data/admin-dashboard-data"
import {
  useGetDashboardCountsQuery,
  useLazyGetCardDataQuery,
} from "@/store/api/dashboard/dashboardApi"
import type {
  DashboardCounts,
  CardApiType,
  ActiveLearnersSummary,
  ActiveLearnersCardDataResponse,
} from "@/store/api/dashboard/types"
import { cardApiTypeToCountKey } from "@/store/api/dashboard/types"
import { useAppSelector } from "@/store/hooks"

/* ============================================================
   CSV HEADER MAPPING
============================================================ */

const CSV_HEADER_NAMES: Record<string, string> = {
  learner_id: "Learner ID",
  first_name: "First Name",
  last_name: "Last Name",
  email: "Email",
  end_date: "End Date",
  start_date: "Start Date",
  course_status: "Course Status",
  startDate: "Start Date",
  plan_type: "Plan Type",
  target_date: "Target Date",
  overdue: "Overdue",
  on_track: "On Track",
}

/* ============================================================
   SAFE HELPERS
============================================================ */

const parsePercentage = (value: unknown): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") {
    return Number(value.replace("%", "").trim()) || 0
  }
  return 0
}

/* ============================================================
   FLATTEN + COMPUTED FIELDS
============================================================ */

function flattenRowForCsv(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row }

  /* -------- Flatten nested learner object -------- */
  if (
    row.learner_id &&
    typeof row.learner_id === "object" &&
    !Array.isArray(row.learner_id)
  ) {
    const learner = row.learner_id as Record<string, unknown>

    out.learner_id = learner.learner_id
    out.first_name = learner.first_name ?? out.first_name
    out.last_name = learner.last_name ?? out.last_name
    out.email =
      learner.email ??
      (learner.user_id as Record<string, unknown>)?.email ??
      out.email
  }

  /* -------- Remove file path columns -------- */
  delete out.file_path
  delete out.filePath
  delete out.file_path_link

  /* -------- OVERDUE LOGIC -------- */
  const today = new Date()

  const endDateRaw =
    (row.planned_end_date as string) ||
    (row.end_date as string)

  let overdue = "No"

  if (endDateRaw) {
    const endDate = new Date(endDateRaw)
    if (!isNaN(endDate.getTime()) && today > endDate) {
      overdue = "Yes"
    }
  }

  out.overdue = overdue

  /* -------- ON TRACK LOGIC -------- */
  const overallProgress = parsePercentage(row.overall_progress)
  const timelineProgress = parsePercentage(row.timeline_progress)

  let onTrack = "No"

  if (
    overallProgress >= timelineProgress &&
    timelineProgress > 0
  ) {
    onTrack = "Yes"
  }

  out.on_track = onTrack

  return out
}

/* ============================================================
   COMPONENT
============================================================ */

export function AdminDashboard() {
  const t = useTranslations("dashboard")
  const userRole = useAppSelector((state) => state.auth.user?.role)

  const { data: dashboardData, isLoading: loading } =
    useGetDashboardCountsQuery(undefined, {
      skip: !userRole || userRole === "Learner",
    })

  const [getCardData] = useLazyGetCardDataQuery()
  const [exporting, setExporting] = useState<Record<string, boolean>>({})

  const [activeLearnersDialog, setActiveLearnersDialog] = useState<{
    open: boolean
    summary?: ActiveLearnersSummary | null
  }>({ open: false, summary: null })

  const counts: DashboardCounts =
    dashboardData?.data || ({} as DashboardCounts)

  /* ============================================================
     EXPORT HANDLER
  ============================================================ */

  const handleExport = async (apiType: string, title: string) => {
    setExporting((prev) => ({ ...prev, [apiType]: true }))

    try {
      const response = await getCardData(apiType).unwrap()
      const res = response as ActiveLearnersCardDataResponse

      const data =
        (res.data as unknown[]) ||
        (res.learners as unknown[]) ||
        (res.list as unknown[]) ||
        []

      const summary = res.summary
      const csvParts: string[] = []

      /* -------- Add summary if exists -------- */
      if (apiType === "active_learners" && summary) {
        const summaryRows: string[] = []

        if (summary.sa_unmapped_evidence_count !== undefined) {
          summaryRows.push(
            `SA + unmapped evidence,${summary.sa_unmapped_evidence_count}`
          )
        }

        if (summary.outstanding_iqa_actions_count !== undefined) {
          summaryRows.push(
            `Outstanding IQA actions,${summary.outstanding_iqa_actions_count}`
          )
        }

        if (summaryRows.length > 0) {
          csvParts.push(summaryRows.join("\n"), "")
        }
      }

      /* -------- Data rows -------- */
      if (Array.isArray(data) && data.length > 0) {
        const flatRows = data.map((row) =>
          flattenRowForCsv(row as Record<string, unknown>)
        )

        const rawHeaders = Object.keys(flatRows[0])
        const headers = rawHeaders.map(
          (h) =>
            CSV_HEADER_NAMES[h] ??
            h.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        )

        const csvHeaders = headers
          .map((h) => `"${h.replace(/"/g, '""')}"`)
          .join(",")

        const csvRows = flatRows.map((row) =>
          rawHeaders
            .map((header) => {
              const value = row[header]
              if (value === null || value === undefined) return '""'
              const str =
                value instanceof Date
                  ? value.toISOString()
                  : String(value)
              return `"${str.replace(/"/g, '""')}"`
            })
            .join(",")
        )

        csvParts.push(csvHeaders, ...csvRows)
      }

      /* -------- Generate File -------- */
      if (csvParts.length > 0) {
        const blob = new Blob([csvParts.join("\n")], {
          type: "text/csv;charset=utf-8;",
        })

        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        link.href = url
        link.download = `${title.replace(/\s+/g, "_")}_${
          new Date().toISOString().split("T")[0]
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
    userRole === "Admin" ? t("adminDashboard") : t("dashboard")

  return (
    <div className="flex flex-col gap-6">
      <div className="px-4 lg:px-6">
        <PageHeader title={dashboardTitle} icon={ShieldCheck} />
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {dashboardCards
            .filter((card) => card.id !== "overall_progress")
            .map((card) => {
              const apiType: CardApiType | string | undefined =
                card.apiType || cardTypeMapping[card.title]

              const countKey =
                apiType && apiType in cardApiTypeToCountKey
                  ? cardApiTypeToCountKey[apiType as CardApiType]
                  : apiType

              const count =
                apiType &&
                countKey &&
                counts[countKey] !== undefined
                  ? counts[countKey]?.toString()
                  : card.name || "0"

              const displayCount = loading ? "..." : count
              const isExporting = apiType
                ? exporting[apiType] || false
                : false

              const showExport =
                Boolean(
                  apiType &&
                    countKey &&
                    counts[countKey] !== undefined &&
                    counts[countKey]! > 0
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
        title="Active Learner"
        count={counts.active_learners_count ?? "0"}
        summary={activeLearnersDialog.summary}
      />
    </div>
  )
}