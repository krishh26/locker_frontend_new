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

/** Flatten nested learner objects (e.g. learner_id.learner_id) for CSV export. Fallback when API returns nested structure. */
function flattenRowForCsv(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row }
  if (row.learner_id && typeof row.learner_id === "object" && !Array.isArray(row.learner_id)) {
    const l = row.learner_id as Record<string, unknown>
    out.learner_id = l.learner_id
    out.first_name = l.first_name ?? out.first_name
    out.last_name = l.last_name ?? out.last_name
    out.email = l.email ?? (l.user_id as Record<string, unknown>)?.email ?? out.email
  }
  return out
}

/** Map snake_case keys to CSV-friendly display names. */
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
}

// Beautiful gradient backgrounds for cards – cycles across all cards
const cardBgColors = [
  // Emerald / Mint
  "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-300/60 dark:border-emerald-800/30",
  // Rose / Coral
  "bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/50 dark:to-pink-950/40 border-rose-300/60 dark:border-rose-800/30",
  // Sky / Azure
  "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950/50 dark:to-blue-950/40 border-sky-300/60 dark:border-sky-800/30",
  // Violet / Lavender
  "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/50 dark:to-purple-950/40 border-violet-300/60 dark:border-violet-800/30",
  // Amber / Warm
  "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/40 border-amber-300/60 dark:border-amber-800/30",
  // Cyan / Ocean
  "bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-950/50 dark:to-teal-950/40 border-cyan-300/60 dark:border-cyan-800/30",
  // Fuchsia / Berry
  "bg-gradient-to-br from-fuchsia-100 to-pink-100 dark:from-fuchsia-950/50 dark:to-pink-950/40 border-fuchsia-300/60 dark:border-fuchsia-800/30",
  // Indigo / Deep Blue
  "bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/50 dark:to-blue-950/40 border-indigo-300/60 dark:border-indigo-800/30",
  // Lime / Fresh
  "bg-gradient-to-br from-lime-100 to-green-100 dark:from-lime-950/50 dark:to-green-950/40 border-lime-300/60 dark:border-lime-800/30",
  // Orange / Sunset
  "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/40 border-orange-300/60 dark:border-orange-800/30",
]

export function AdminDashboard() {
  const t = useTranslations("dashboard")
  const userRole = useAppSelector((state) => state.auth.user?.role)
  
  const { data: dashboardData, isLoading: loading } = useGetDashboardCountsQuery(undefined, {
    skip: !userRole || userRole === "Learner",
  })
  const [getCardData] = useLazyGetCardDataQuery()
  const [exporting, setExporting] = useState<Record<string, boolean>>({})
  const [activeLearnersDialog, setActiveLearnersDialog] = useState<{
    open: boolean
    summary?: ActiveLearnersSummary | null
  }>({ open: false, summary: null })
  // Extract counts from API response
  const counts: DashboardCounts = dashboardData?.data || ({} as DashboardCounts)

  const handleExport = async (apiType: string, title: string) => {
    setExporting((prev) => ({ ...prev, [apiType]: true }))
    try {
      const response = await getCardData(apiType).unwrap()
      const res = response as ActiveLearnersCardDataResponse

      // Active learners: include summary metrics when BE returns them
      const data =
        (res.data as unknown[]) ||
        (res.learners as unknown[]) ||
        (res.list as unknown[]) ||
        []
      const summary = res.summary

      const csvParts: string[] = []

      if (apiType === "active_learners" && summary) {
        const summaryRows: string[] = []
        if (summary.sa_unmapped_evidence_count !== undefined) {
          summaryRows.push(`SA + unmapped evidence,${summary.sa_unmapped_evidence_count}`)
        }
        if (summary.outstanding_iqa_actions_count !== undefined) {
          summaryRows.push(`Outstanding IQA actions,${summary.outstanding_iqa_actions_count}`)
        }
        if (summary.orange_percent_last_month !== undefined) {
          summaryRows.push(`Orange % last month,${summary.orange_percent_last_month}`)
        }
        if (summary.orange_percent_current_month !== undefined) {
          summaryRows.push(`Orange % current month,${summary.orange_percent_current_month}`)
        }
        if (summary.green_percent_last_month !== undefined) {
          summaryRows.push(`Green % last month,${summary.green_percent_last_month}`)
        }
        if (summary.green_percent_current_month !== undefined) {
          summaryRows.push(`Green % current month,${summary.green_percent_current_month}`)
        }
        if (summaryRows.length > 0) {
          csvParts.push(summaryRows.join("\n"), "")
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        const flatRows = data.map((row) =>
          flattenRowForCsv(row as Record<string, unknown>)
        )
        const rawHeaders = Object.keys(flatRows[0] as Record<string, unknown>)
        const headers = rawHeaders.map(
          (h) => CSV_HEADER_NAMES[h] ?? h.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        )
        const csvHeaders = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",")
        const csvRows = flatRows.map((row) =>
          rawHeaders
            .map((header) => {
              const value = (row as Record<string, unknown>)[header]
              if (value === null || value === undefined) return '""'
              if (typeof value === "object" && value !== null && !(value instanceof Date)) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`
              }
              const str = value instanceof Date ? value.toISOString() : String(value)
              return `"${str.replace(/"/g, '""')}"`
            })
            .join(",")
        )
        csvParts.push(csvHeaders, ...csvRows)
      }

      const csvContent = csvParts.length > 0 ? csvParts.join("\n") : null
      if (csvContent) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute(
          "download",
          `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
        )
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else if (!(apiType === "active_learners" && summary)) {
        console.warn("No data available to export")
      }
    } catch (error) {
      console.error(`Failed to export ${apiType}:`, error)
    } finally {
      setExporting((prev) => ({ ...prev, [apiType]: false }))
    }
  }


  const dashboardTitle = userRole === "Admin" ? t("adminDashboard") : t("dashboard")


  return (
    <div className="flex flex-col gap-6">
      <div className="px-4 lg:px-6">
        <PageHeader
          title={dashboardTitle}
          icon={ShieldCheck}
        />
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {dashboardCards.filter((card) => card.id !== "overall_progress").map((card, index) => {
            // Get count from API or use default name
            const apiType: CardApiType | string | undefined = card.apiType || cardTypeMapping[card.title]
            // Map CardApiType to DashboardCounts key if it's a valid CardApiType
            const countKey = apiType && apiType in cardApiTypeToCountKey 
              ? cardApiTypeToCountKey[apiType as CardApiType]
              : apiType
            const count = apiType && countKey && counts[countKey] !== undefined
              ? counts[countKey]?.toString()
              : (card.name || "0")
            const displayCount = loading ? "..." : count
            const isExporting = apiType ? exporting[apiType] || false : false
            const showExport = Boolean(apiType && countKey && counts[countKey] !== undefined && counts[countKey]! > 0)

            return (
              <AdminDashboardCard
                key={card.id}
                title={card.title}
                count={displayCount}
                textColor={card.textColor}
                radiusColor={card.radiusColor}
                onExport={apiType ? () => handleExport(apiType, card.title) : undefined}
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
        title="Active Learner"
        count={
          counts.active_learners_count !== undefined
            ? counts.active_learners_count
            : "0"
        }
        summary={activeLearnersDialog.summary}
      />
    </div>
  )
}

