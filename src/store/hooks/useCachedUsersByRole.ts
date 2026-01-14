import { useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { useGetUsersByRoleQuery } from "@/store/api/user/userApi"
import { selectUsersByRole } from "@/store/slices/cacheSlice"

export const useCachedUsersByRole = (role: string, options?: { skip?: boolean }) => {
  const cachedData = useAppSelector((state) => selectUsersByRole(state, role))
  
  // Only fetch if cache is empty for this role and not explicitly skipped
  const shouldFetch = cachedData === null && !options?.skip
  
  const {
    data: apiData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUsersByRoleQuery(role, {
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

