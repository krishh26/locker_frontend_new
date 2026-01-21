"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList"

interface CourseAutocompleteProps {
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
  multiple?: boolean
}

export function CourseAutocomplete({
  value,
  onValueChange,
  placeholder = "Select course...",
  disabled = false,
  className,
  error = false,
  multiple = false,
}: CourseAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [displayedCount, setDisplayedCount] = React.useState(10)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Fetch courses using cached hook
  const { data: coursesData, isLoading } = useCachedCoursesList()

  // Get all courses from response
  const allCourses = React.useMemo(() => {
    return coursesData?.data || []
  }, [coursesData])

  // Filter courses based on search term
  const filteredCourses = React.useMemo(() => {
    if (!search.trim()) {
      return allCourses
    }
    const searchLower = search.toLowerCase()
    return allCourses.filter((course) =>
      course.course_name?.toLowerCase().includes(searchLower)
    )
  }, [allCourses, search])

  // Get displayed courses (paginated)
  const displayedCourses = React.useMemo(() => {
    return filteredCourses.slice(0, displayedCount)
  }, [filteredCourses, displayedCount])

  // Normalize value to array for multi-select, single value for single-select
  const normalizedValue = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : value ? [value] : []
    }
    return Array.isArray(value) ? value[0] : value
  }, [value, multiple])

  // Find selected course(s)
  const selectedCoursesArray = React.useMemo(() => {
    if (multiple) {
      const ids = normalizedValue as string[]
      return allCourses.filter((course) =>
        ids.includes(course.course_id?.toString() || "")
      )
    }
    return []
  }, [allCourses, normalizedValue, multiple])

  const selectedCourse = React.useMemo(() => {
    if (multiple) return null
    const id = normalizedValue as string
    if (!id) return null
    return allCourses.find((course) => course.course_id?.toString() === id) || null
  }, [allCourses, normalizedValue, multiple])

  // Reset displayed count when search changes
  React.useEffect(() => {
    setDisplayedCount(10)
  }, [search])

  // Handle scroll to load more
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const scrollPercentage =
        (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100

      // Load more when 80% scrolled
      if (scrollPercentage > 80 && displayedCount < filteredCourses.length) {
        setDisplayedCount((prev) => Math.min(prev + 10, filteredCourses.length))
      }
    },
    [displayedCount, filteredCourses.length]
  )

  // Handle course selection
  const handleSelect = React.useCallback(
    (courseId: string) => {
      if (disabled) return

      if (multiple) {
        const currentIds = (normalizedValue as string[]) || []
        const isSelected = currentIds.includes(courseId)
        const newIds = isSelected
          ? currentIds.filter((id) => id !== courseId)
          : [...currentIds, courseId]
        onValueChange?.(newIds)
        // Keep popover open in multi-select mode
      } else {
        onValueChange?.(courseId === normalizedValue ? "" : courseId)
        setOpen(false)
        setSearch("")
      }
    },
    [disabled, multiple, normalizedValue, onValueChange]
  )

  // Handle removing a selected course in multi-select mode
  const handleRemoveCourse = React.useCallback(
    (e: React.MouseEvent, courseId: string) => {
      e.stopPropagation()
      if (disabled || !multiple) return
      const currentIds = (normalizedValue as string[]) || []
      const newIds = currentIds.filter((id) => id !== courseId)
      onValueChange?.(newIds)
    },
    [disabled, multiple, normalizedValue, onValueChange]
  )

  // Prevent popover from opening when disabled
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (disabled) return
      setOpen(newOpen)
    },
    [disabled]
  )

  return (
    <Popover open={open && !disabled} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select course"
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between min-h-9 h-auto",
            !selectedCourse && !(multiple && selectedCoursesArray.length > 0) && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1 items-center min-w-0">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                <span className="text-sm">Loading courses...</span>
              </>
            ) : multiple ? (
              selectedCoursesArray.length > 0 ? (
                <>
                  {selectedCoursesArray.slice(0, 3).map((course) => (
                    <Badge
                      key={course.course_id}
                      variant="secondary"
                      className="mr-1"
                    >
                      <span className="truncate max-w-[150px]">
                        {course.course_name || "Unknown course"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCourse(e, course.course_id?.toString() || "")}
                        className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === "Enter") {
                            handleRemoveCourse(e as unknown as React.MouseEvent, course.course_id?.toString() || "")
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedCoursesArray.length > 3 && (
                    <Badge variant="secondary" className="mr-1">
                      +{selectedCoursesArray.length - 3} more
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-sm">{placeholder}</span>
              )
            ) : selectedCourse ? (
              <span className="truncate text-sm">
                {selectedCourse.course_name || "Unknown course"}
              </span>
            ) : (
              <span className="text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-100" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search courses..."
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
                  Loading courses...
                </span>
              </div>
            ) : displayedCourses.length === 0 ? (
              <CommandEmpty>
                {search ? "No courses found." : "No courses available."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {displayedCourses.map((course) => {
                  const courseId = course.course_id?.toString() || ""
                  const isSelected = multiple
                    ? (normalizedValue as string[]).includes(courseId)
                    : normalizedValue === courseId
                  return (
                    <CommandItem
                      key={course.course_id}
                      value={courseId}
                      onSelect={() => handleSelect(courseId)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate flex-1">
                        {course.course_name || "Unknown course"}
                      </span>
                      {isSelected && <Check className="ml-2 h-4 w-4 shrink-0" />}
                    </CommandItem>
                  )
                })}
                {displayedCount < filteredCourses.length && (
                  <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">
                    Scroll for more courses ({filteredCourses.length - displayedCount} more)
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
