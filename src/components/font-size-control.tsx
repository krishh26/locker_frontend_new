"use client"

import * as React from "react"
import { Type } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFontScale } from "@/hooks/use-font-scale"

const marks = [0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3] as const
const STEP = 0.1

export function FontSizeControl() {
  const { scale, setScale, commitScale, reset } = useFontScale()
  const [open, setOpen] = React.useState(false)

  const dec = React.useCallback(() => {
    const next = Math.round((scale - STEP) * 10) / 10
    setScale(next)
    commitScale(next)
  }, [commitScale, scale, setScale])

  const inc = React.useCallback(() => {
    const next = Math.round((scale + STEP) * 10) / 10
    setScale(next)
    commitScale(next)
  }, [commitScale, scale, setScale])

  const handleCommit = React.useCallback(() => {
    commitScale()
  }, [commitScale])

  React.useEffect(() => {
    // Ensure slider value reflects persisted state when reopening.
    if (open) {
      setScale(scale)
    }
  }, [open, scale, setScale])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Font size">
          <Type className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold leading-none">Font Size</div>
              <div className="text-xs text-muted-foreground">70% – 130%</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold tabular-nums text-muted-foreground">
                {Math.round(scale * 100)}%
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => {
                  reset()
                }}
                type="button"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={dec}
              type="button"
              aria-label="Decrease font size"
            >
              A-
            </Button>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={STEP}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              onMouseUp={handleCommit}
              onTouchEnd={handleCommit}
              onKeyUp={(e) => {
                if (e.key === "Enter") handleCommit()
              }}
              className="w-full accent-primary"
              aria-label="Font size slider"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={inc}
              type="button"
              aria-label="Increase font size"
            >
              A+
            </Button>
          </div>

          <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
            {marks.map((m) => (
              <span
                key={m}
                className={m === scale ? "text-foreground" : undefined}
              >
                {Math.round(m * 100)}%
              </span>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

