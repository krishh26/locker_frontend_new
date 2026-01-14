import { useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { useGetLearnersListQuery } from "@/store/api/learner/learnerApi"
import { selectLearnersList } from "@/store/slices/cacheSlice"
import type { LearnerFilters } from "@/store/api/learner/types"

export const useCachedLearnersList = (options?: { skip?: boolean }) => {
  const cachedData = useAppSelector(selectLearnersList)
  
  // Only fetch if cache is empty and not explicitly skipped
  const shouldFetch = cachedData === null && !options?.skip
  
  // Use default filters for cached list (first page, default page size)
  const filters: LearnerFilters = {
    page: 1,
    page_size: 10,
  }
  
  const {
    data: apiData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetLearnersListQuery(filters, {
    skip: !shouldFetch, // Skip the query if we have cached data or explicitly skipped
  })

  // Use cached data if available, otherwise use API data
  const data = useMemo(() => {
    if (cachedData !== null) {
      return {
        status: true,
        message: "Success",
        data: cachedData,
      }
    }
    return apiData
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

