"use client"

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
                  <span className="text-muted-foreground">SA + unmapped evidence</span>
                  <span className="font-medium tabular-nums">
                    {summary.sa_unmapped_evidence_count}
                  </span>
                </div>
              )}
              {summary.outstanding_iqa_actions_count !== undefined && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Outstanding IQA actions</span>
                  <span className="font-medium tabular-nums">
                    {summary.outstanding_iqa_actions_count}
                  </span>
                </div>
              )}
              {(summary.orange_percent_last_month !== undefined ||
                summary.orange_percent_current_month !== undefined) && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Orange %</span>
                  <div className="flex gap-4 pl-2">
                    {summary.orange_percent_last_month !== undefined && (
                      <span className="tabular-nums">
                        Last month: {summary.orange_percent_last_month}%
                      </span>
                    )}
                    {summary.orange_percent_current_month !== undefined && (
                      <span className="tabular-nums">
                        Current: {summary.orange_percent_current_month}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              {(summary.green_percent_last_month !== undefined ||
                summary.green_percent_current_month !== undefined) && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Green %</span>
                  <div className="flex gap-4 pl-2">
                    {summary.green_percent_last_month !== undefined && (
                      <span className="tabular-nums">
                        Last month: {summary.green_percent_last_month}%
                      </span>
                    )}
                    {summary.green_percent_current_month !== undefined && (
                      <span className="tabular-nums">
                        Current: {summary.green_percent_current_month}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {!hasSummary && (
            <p className="text-muted-foreground text-sm">
              Additional metrics (SA + unmapped evidence, outstanding IQA actions,
              orange and green %) will appear here when provided by the server.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
