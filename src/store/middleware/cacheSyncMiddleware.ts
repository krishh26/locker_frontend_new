import { Middleware } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { learnerApi } from "@/store/api/learner/learnerApi"
import { userApi } from "@/store/api/user/userApi"
import { courseApi } from "@/store/api/course/courseApi"
import { setLearnersList, setUsersByRole, setCoursesList } from "@/store/slices/cacheSlice"

export const cacheSyncMiddleware: Middleware<object, RootState> = (store) => (next) => (action) => {
  // Handle learners list response
  if (learnerApi.endpoints.getLearnersList.matchFulfilled(action)) {
    const response = action.payload
    if (response?.status && response?.data) {
      store.dispatch(setLearnersList(response.data))
    }
  }

  // Handle users by role response
  if (userApi.endpoints.getUsersByRole.matchFulfilled(action)) {
    const response = action.payload
    if (response?.status && response?.data) {
      // Extract role from the original query arg
      // In RTK Query, action.meta.arg.originalArgs contains the original argument
      const role = action.meta?.arg?.originalArgs
      if (role && typeof role === "string") {
        store.dispatch(setUsersByRole({ role, users: response.data }))
      }
    }
  }

  // Handle courses list response
  // Only cache when fetching with large page_size (>= 1000) to avoid caching paginated management queries
  if (courseApi.endpoints.getCourses.matchFulfilled(action)) {
    const response = action.payload
    if (response?.status && response?.data) {
      // Extract filters from the original query arg
      const filters = action.meta?.arg?.originalArgs
      // Only cache if page_size is >= 1000 (indicating a fetch-all request)
      if (filters && (filters.page_size ?? 0) >= 1000) {
        store.dispatch(setCoursesList(response.data))
      }
    }
  }

  return next(action)
}

