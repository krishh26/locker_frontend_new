"use client"

import { Card, CardContent } from "@/components/ui/card"    
import { Button } from "@/components/ui/button"
import { Download, Loader2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AdminDashboardCardProps {
  title: string
  count?: number | string
  textColor: string
  radiusColor: string
  icon?: LucideIcon
  variant?: "default" | "license"
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
  icon: Icon,
  variant = "default",
}: AdminDashboardCardProps) {
  const isLicense = variant === "license"
  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onExport && !isExporting) {
      onExport()
    }
  }

  return (
    <Card
      className={cn(
        "relative h-full transition-all hover:scale-[1.01] cursor-pointer group w-full",
        isLicense
          ? "min-h-[112px] border-0 shadow-lg ring-2 ring-offset-2 ring-offset-background"
          : "border border-border/60 shadow-sm hover:shadow-md",
        className
      )}
    >
      <CardContent className={cn(isLicense && "px-4 py-3")}>
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

        <div
          className={cn(
            "flex flex-col items-center justify-center text-center",
            isLicense ? "space-y-1.5" : "space-y-4",
          )}
        >
          {Icon ? (
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-white/25 transition-transform group-hover:scale-110",
                isLicense ? "h-9 w-9" : "h-8 w-8",
              )}
            >
              <Icon
                className={cn(
                  "text-white",
                  isLicense ? "h-5 w-5" : "h-6 w-6 opacity-90",
                )}
                aria-hidden
              />
            </div>
          ) : null}
          <div
            className={cn(
              "flex items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              isLicense ? "min-w-[3.25rem] px-3 py-1 rounded-lg" : "w-10 h-10 rounded-lg",
            )}
            style={{ backgroundColor: radiusColor }}
          >
            <div
              style={{ color: textColor }}
              className={cn(
                "font-bold tabular-nums",
                isLicense ? "text-2xl" : "text-sm font-semibold",
              )}
            >
              {typeof count === "number" ? count.toLocaleString() : count}
            </div>
          </div>

          <div className="space-y-2 w-full">
            <h3
              className={cn(
                "text-white transition-colors truncate line-clamp-2",
                isLicense
                  ? "text-xs font-semibold uppercase tracking-wide"
                  : "font-medium text-base group-hover:text-white/80 line-clamp-1",
              )}
              title={title}
            >
              {title}
            </h3>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

