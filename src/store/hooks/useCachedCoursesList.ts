import { useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { useGetCoursesQuery } from "@/store/api/course/courseApi"
import { selectCoursesList } from "@/store/slices/cacheSlice"
import type { CourseFilters } from "@/store/api/course/types"

export const useCachedCoursesList = (options?: { skip?: boolean }) => {
  const cachedData = useAppSelector(selectCoursesList)
  
  // Only fetch if cache is empty and not explicitly skipped
  const shouldFetch = cachedData === null && !options?.skip
  
  // Use large page_size to fetch all active courses for caching
  const filters: CourseFilters = {
    page: 1,
    page_size: 1000,
    scope: "organisation",
    status: "active",
  }
  
  const {
    data: apiData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCoursesQuery(filters, {
    skip: !shouldFetch, // Skip the query if we have cached data or explicitly skipped
  })

  // Use cached data if available, otherwise use API data
  // Soft-deleted courses (active=false) must not appear in selectors
  const data = useMemo(() => {
    const source =
      cachedData !== null
        ? { status: true, message: "Success", data: cachedData }
        : apiData

    if (!source?.data) return source

    return {
      ...source,
      data: source.data.filter((course) => course.active !== false),
    }
  }, [cachedData, apiData])

  return {
    data,
    isLoading: shouldFetch ? isLoading : false,
    isError,
    error,
    refetch,
    isCached: cachedData !== null,
  }
}
