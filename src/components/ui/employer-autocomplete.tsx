"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useGetEmployersQuery } from "@/store/api/employer/employerApi"
import type { Employer } from "@/store/api/employer/types"

interface EmployerAutocompleteProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  loadingLabel?: string
  emptyLabel?: string
  noResultsLabel?: string
  disabled?: boolean
  className?: string
  error?: boolean
  additionalEmployers?: Pick<Employer, "employer_id" | "employer_name">[]
}

export function EmployerAutocomplete({
  value,
  onValueChange,
  placeholder = "Select employer...",
  searchPlaceholder = "Search employers...",
  loadingLabel = "Loading employers...",
  emptyLabel = "No employers available.",
  noResultsLabel = "No employers found.",
  disabled = false,
  className,
  error = false,
  additionalEmployers = [],
}: EmployerAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [displayedCount, setDisplayedCount] = React.useState(10)
  const listRef = React.useRef<HTMLDivElement>(null)

  const { data: employersData, isLoading } = useGetEmployersQuery({
    page: 1,
    page_size: 1000,
  })

  const allEmployers = React.useMemo(() => {
    const rows = employersData?.data ?? []
    const byId = new Map<number, Pick<Employer, "employer_id" | "employer_name">>()

    for (const employer of rows) {
      byId.set(employer.employer_id, employer)
    }

    for (const employer of additionalEmployers) {
      if (!byId.has(employer.employer_id)) {
        byId.set(employer.employer_id, employer)
      }
    }

    return Array.from(byId.values()).sort((a, b) =>
      a.employer_name.localeCompare(b.employer_name),
    )
  }, [employersData?.data, additionalEmployers])

  const filteredEmployers = React.useMemo(() => {
    if (!search.trim()) return allEmployers
    const searchLower = search.toLowerCase()
    return allEmployers.filter((employer) =>
      employer.employer_name.toLowerCase().includes(searchLower),
    )
  }, [allEmployers, search])

  const displayedEmployers = React.useMemo(
    () => filteredEmployers.slice(0, displayedCount),
    [filteredEmployers, displayedCount],
  )

  const selectedEmployer = React.useMemo(() => {
    if (!value) return null
    return (
      allEmployers.find(
        (employer) => employer.employer_id.toString() === value,
      ) ?? null
    )
  }, [allEmployers, value])

  React.useEffect(() => {
    setDisplayedCount(10)
  }, [search])

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const scrollPercentage =
        (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100

      if (scrollPercentage > 80 && displayedCount < filteredEmployers.length) {
        setDisplayedCount((prev) =>
          Math.min(prev + 10, filteredEmployers.length),
        )
      }
    },
    [displayedCount, filteredEmployers.length],
  )

  const handleSelect = React.useCallback(
    (employerId: string) => {
      if (disabled) return
      onValueChange?.(employerId === value ? "" : employerId)
      setOpen(false)
      setSearch("")
    },
    [disabled, onValueChange, value],
  )

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (disabled) return
      setOpen(newOpen)
    },
    [disabled],
  )

  return (
    <Popover open={open && !disabled} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select employer"
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between min-h-10 h-auto font-normal",
            !selectedEmployer && "text-muted-foreground",
            error && "border-destructive",
            className,
          )}
        >
          <span className="truncate text-sm">
            {isLoading ? (
              <span className="inline-flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                {loadingLabel}
              </span>
            ) : selectedEmployer ? (
              selectedEmployer.employer_name
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0 z-100"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            disabled={disabled}
          />
          <CommandList
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-[300px] overflow-y-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  {loadingLabel}
                </span>
              </div>
            ) : displayedEmployers.length === 0 ? (
              <CommandEmpty>
                {search ? noResultsLabel : emptyLabel}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {displayedEmployers.map((employer) => {
                  const employerId = employer.employer_id.toString()
                  const isSelected = value === employerId
                  return (
                    <CommandItem
                      key={employer.employer_id}
                      value={employerId}
                      onSelect={() => handleSelect(employerId)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate flex-1">
                        {employer.employer_name}
                      </span>
                      {isSelected && (
                        <Check className="ml-2 h-4 w-4 shrink-0" />
                      )}
                    </CommandItem>
                  )
                })}
                {displayedCount < filteredEmployers.length && (
                  <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">
                    Scroll for more employers (
                    {filteredEmployers.length - displayedCount} more)
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
