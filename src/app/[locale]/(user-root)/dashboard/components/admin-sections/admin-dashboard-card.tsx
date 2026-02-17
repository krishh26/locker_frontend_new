"use client"

import { Card, CardContent } from "@/components/ui/card"    
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AdminDashboardCardProps {
  title: string
  count?: number | string
  textColor: string
  radiusColor: string
  onExport?: () => void
  isExporting?: boolean
  showExport?: boolean
  className?: string
}

export function AdminDashboardCard({
  title,
  count,
  textColor,
  radiusColor,
  onExport,
  isExporting = false,
  showExport = false,
  className,
}: AdminDashboardCardProps) {
  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onExport && !isExporting) {
      onExport()
    }
  }

  return (
    <Card
      className={cn(
        "relative h-full border border-border/60 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group w-full",
        className
      )}
    >
      <CardContent>
        {showExport && onExport && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 z-10 text-white hover:text-white/80 hover:bg-white/10"
            onClick={handleExportClick}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        )}

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: radiusColor }}
          >
            <div style={{ color: textColor }} className="text-sm font-semibold">
              {typeof count === "number" ? count.toLocaleString() : count}
            </div>
          </div>

          <div className="space-y-2 w-full">
            <h3 className="font-medium text-base text-white group-hover:text-white/80 transition-colors truncate line-clamp-1" title={title}>
              {title}
            </h3>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

