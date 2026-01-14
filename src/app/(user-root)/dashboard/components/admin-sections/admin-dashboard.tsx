"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { AdminDashboardCard } from "./admin-dashboard-card"
import { dashboardCards, cardTypeMapping } from "../../data/admin-dashboard-data"
import {
  useGetDashboardCountsQuery,
  useLazyGetCardDataQuery,
} from "@/store/api/dashboard/dashboardApi"
import type { DashboardCounts } from "@/store/api/dashboard/types"

export function AdminDashboard() {
  const { data: dashboardData, isLoading: loading } = useGetDashboardCountsQuery()
  const [getCardData] = useLazyGetCardDataQuery()
  const [exporting, setExporting] = useState<Record<string, boolean>>({})
  const [fetchingData, setFetchingData] = useState<Record<string, boolean>>({})

  // Extract counts from API response
  const counts: DashboardCounts = dashboardData?.data || ({} as DashboardCounts)

  const handleExport = async (apiType: string, title: string) => {
    setExporting((prev) => ({ ...prev, [apiType]: true }))
    try {
      const response = await getCardData(apiType).unwrap()
      
      // Handle different response structures
      const data =
        (response.data as unknown[]) ||
        (response.learners as unknown[]) ||
        (response.list as unknown[]) ||
        []

      if (Array.isArray(data) && data.length > 0) {
        // Get headers from the first object
        const headers = Object.keys(data[0] as Record<string, unknown>)

        // Create CSV content
        const csvHeaders = headers.join(",")
        const csvRows = data.map((row) => {
          return headers
            .map((header) => {
              const value = (row as Record<string, unknown>)[header]
              // Handle nested objects and arrays
              if (value === null || value === undefined) {
                return '""'
              }
              if (typeof value === "object") {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`
              }
              return `"${String(value).replace(/"/g, '""')}"`
            })
            .join(",")
        })

        const csvContent = [csvHeaders, ...csvRows].join("\n")

        // Create and download the CSV file
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
      } else {
        console.warn("No data available to export")
      }
    } catch (error) {
      console.error(`Failed to export ${apiType}:`, error)
    } finally {
      setExporting((prev) => ({ ...prev, [apiType]: false }))
    }
  }

  const handleFetchData = async (apiType: string) => {
    if (fetchingData[apiType]) return

    setFetchingData((prev) => ({ ...prev, [apiType]: true }))
    try {
      const response = await getCardData(apiType).unwrap()
      
      // Handle different response structures
      const data =
        (response.data as unknown[]) ||
        (response.learners as unknown[]) ||
        (response.list as unknown[]) ||
        []

      // TODO: Display the data in a modal or table
      console.log(`Fetched data for ${apiType}:`, data)
    } catch (error) {
      console.error(`Failed to fetch ${apiType} data:`, error)
    } finally {
      setFetchingData((prev) => ({ ...prev, [apiType]: false }))
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="px-4 lg:px-6">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Manage users, learners, courses, and system settings"
          icon={ShieldCheck}
        />
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {dashboardCards.map((card) => {
            // Get count from API or use default name
            const apiType = card.apiType || cardTypeMapping[card.title]
            const count = apiType && counts[apiType] !== undefined
              ? counts[apiType]?.toString()
              : (card.name || "0")
            const displayCount = loading ? "..." : count
            const isExporting = apiType ? exporting[apiType] || false : false
            const isFetching = apiType ? fetchingData[apiType] || false : false
            const showExport = !!apiType && counts[apiType] !== undefined && counts[apiType]! > 0

            return (
              <AdminDashboardCard
                key={card.id}
                title={card.title}
                count={displayCount}
                textColor={card.textColor}
                radiusColor={card.radiusColor}
                onClick={() => {
                  if (apiType) {
                    handleFetchData(apiType)
                  }
                }}
                onExport={apiType ? () => handleExport(apiType, card.title) : undefined}
                isExporting={isExporting}
                isFetching={isFetching}
                showExport={showExport}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

