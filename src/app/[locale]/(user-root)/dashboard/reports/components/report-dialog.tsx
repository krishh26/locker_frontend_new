'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLazyGetCardDataQuery } from '@/store/api/dashboard/dashboardApi'
import type { ReportColumnDef, ReportConfig, ReportFlatRow } from '../types'
import { processReportResponse } from '../lib/process-report-response'
import { ReportDataTable } from './report-data-table'

export interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ReportConfig | null
  title: string
  /** Optional pre-built CSV summary lines (e.g. Active Learners KPIs) */
  buildSummaryLines?: (response: unknown) => string[]
}

function downloadCsv(csv: string, filename: string) {
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

export function ReportDialog({
  open,
  onOpenChange,
  config,
  title,
  buildSummaryLines,
}: ReportDialogProps) {
  const [getCardData] = useLazyGetCardDataQuery()
  const [rows, setRows] = useState<ReportFlatRow[]>([])
  const [columns, setColumns] = useState<ReportColumnDef[]>([])
  const [csv, setCsv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !config?.apiType) {
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getCardData(config.apiType!).unwrap()
        if (cancelled) return

        const summaryLines = buildSummaryLines?.(response) ?? []
        const processed = processReportResponse(
          {
            ...config,
            buildSummaryLines: summaryLines.length
              ? () => summaryLines
              : config.buildSummaryLines,
          },
          response,
        )
        setRows(processed.flatRows)
        setColumns(processed.columns)
        setCsv(processed.csv)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load report:', err)
        setError('Failed to load report data')
        setRows([])
        setColumns(config.columns)
        setCsv('')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, config, getCardData, buildSummaryLines])

  const handleExport = () => {
    if (!config || !csv) return
    downloadCsv(
      csv,
      `${config.id}_${new Date().toISOString().split('T')[0]}.csv`,
    )
  }

  const tableColumns = columns.length > 0 ? columns : config?.columns ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] w-[95vw] max-w-6xl flex-col gap-4 overflow-hidden'>
        <DialogHeader className='flex flex-row items-center justify-between gap-4 space-y-0 pr-8'>
          <DialogTitle className='truncate'>{title}</DialogTitle>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={handleExport}
            disabled={loading || !csv}
          >
            {loading ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Download className='mr-2 h-4 w-4' />
            )}
            Export CSV
          </Button>
        </DialogHeader>

        {error ? (
          <p className='text-sm text-destructive'>{error}</p>
        ) : null}

        {config ? (
          <div className='min-h-0 flex-1 overflow-y-auto'>
            <ReportDataTable
              columns={tableColumns}
              data={rows}
              isLoading={loading}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
