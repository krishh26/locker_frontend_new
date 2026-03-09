"use client"

import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ActiveLearnersSummary } from "@/store/api/dashboard/types"

export interface ActiveLearnersDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  count: number | string
  /** When BE returns summary on active_learners endpoint, these metrics are shown. */
  summary?: ActiveLearnersSummary | null
}

export function ActiveLearnersDetailDialog({
  open,
  onOpenChange,
  title,
  count,
  summary,
}: ActiveLearnersDetailDialogProps) {
  const t = useTranslations("dashboard.admin")
  const hasSummary =
    summary &&
    (summary.sa_unmapped_evidence_count !== undefined ||
      summary.outstanding_iqa_actions_count !== undefined ||
      summary.orange_percent_last_month !== undefined ||
      summary.orange_percent_current_month !== undefined ||
      summary.green_percent_last_month !== undefined ||
      summary.green_percent_current_month !== undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-2xl font-semibold tabular-nums">
            {typeof count === "number" ? count.toLocaleString() : count}
          </div>
          {hasSummary && summary && (
            <div className="grid gap-3 text-sm">
              {summary.sa_unmapped_evidence_count !== undefined && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("summarySaUnmapped")}</span>
                  <span className="font-medium tabular-nums">
                    {summary.sa_unmapped_evidence_count}
                  </span>
                </div>
              )}
              {summary.outstanding_iqa_actions_count !== undefined && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("summaryOutstandingIqa")}</span>
                  <span className="font-medium tabular-nums">
                    {summary.outstanding_iqa_actions_count}
                  </span>
                </div>
              )}
              {(summary.orange_percent_last_month !== undefined ||
                summary.orange_percent_current_month !== undefined) && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">{t("orangePercent")}</span>
                  <div className="flex gap-4 pl-2">
                    {summary.orange_percent_last_month !== undefined && (
                      <span className="tabular-nums">
                        {t("lastMonth")}: {summary.orange_percent_last_month}%
                      </span>
                    )}
                    {summary.orange_percent_current_month !== undefined && (
                      <span className="tabular-nums">
                        {t("current")}: {summary.orange_percent_current_month}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              {(summary.green_percent_last_month !== undefined ||
                summary.green_percent_current_month !== undefined) && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">{t("greenPercent")}</span>
                  <div className="flex gap-4 pl-2">
                    {summary.green_percent_last_month !== undefined && (
                      <span className="tabular-nums">
                        {t("lastMonth")}: {summary.green_percent_last_month}%
                      </span>
                    )}
                    {summary.green_percent_current_month !== undefined && (
                      <span className="tabular-nums">
                        {t("current")}: {summary.green_percent_current_month}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {!hasSummary && (
            <p className="text-muted-foreground text-sm">
              {t("metricsFallback")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
