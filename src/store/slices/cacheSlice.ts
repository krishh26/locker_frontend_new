import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import type { LearnerListItem } from "@/store/api/learner/types"
import type { User } from "@/store/api/user/types"
import type { Course } from "@/store/api/course/types"
import { clearCredentials } from "./authSlice"

type CacheState = {
  learnersList: LearnerListItem[] | null
  usersByRole: Record<string, User[]>
  coursesList: Course[] | null
}

const initialState: CacheState = {
  learnersList: null,
  usersByRole: {},
  coursesList: null,
}

const cacheSlice = createSlice({
  name: "cache",
  initialState,
  reducers: {
    setLearnersList: (state, action: PayloadAction<LearnerListItem[]>) => {
      state.learnersList = action.payload
    },
    setUsersByRole: (state, action: PayloadAction<{ role: string; users: User[] }>) => {
      state.usersByRole[action.payload.role] = action.payload.users
    },
    setCoursesList: (state, action: PayloadAction<Course[]>) => {
      state.coursesList = action.payload
    },
    clearLearnersList: (state) => {
      state.learnersList = null
    },
    clearUsersByRole: (state, action: PayloadAction<string>) => {
      delete state.usersByRole[action.payload]
    },
    clearCoursesList: (state) => {
      state.coursesList = null
    },
    clearAllCache: (state) => {
      state.learnersList = null
      state.usersByRole = {}
      state.coursesList = null
    },
  },
  extraReducers: (builder) => {
    // Clear all cache when user logs out
    builder.addCase(clearCredentials, (state) => {
      state.learnersList = null
      state.usersByRole = {}
      state.coursesList = null
    })
  },
})

export const {
  setLearnersList,
  setUsersByRole,
  setCoursesList,
  clearLearnersList,
  clearUsersByRole,
  clearCoursesList,
  clearAllCache,
} = cacheSlice.actions

// Selectors
export const selectLearnersList = (state: RootState) => state.cache.learnersList
export const selectUsersByRole = (state: RootState, role: string) =>
  state.cache.usersByRole[role] || null
export const selectAllCachedUsers = (state: RootState) => state.cache.usersByRole
export const selectCoursesList = (state: RootState) => state.cache.coursesList

export default cacheSlice.reducer

