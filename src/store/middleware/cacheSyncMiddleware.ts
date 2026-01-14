import { Middleware } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { learnerApi } from "@/store/api/learner/learnerApi"
import { userApi } from "@/store/api/user/userApi"
import { setLearnersList, setUsersByRole } from "@/store/slices/cacheSlice"

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

  return next(action)
}

