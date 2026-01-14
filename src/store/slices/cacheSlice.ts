import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import type { LearnerListItem } from "@/store/api/learner/types"
import type { User } from "@/store/api/user/types"

type CacheState = {
  learnersList: LearnerListItem[] | null
  usersByRole: Record<string, User[]>
}

const initialState: CacheState = {
  learnersList: null,
  usersByRole: {},
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
    clearLearnersList: (state) => {
      state.learnersList = null
    },
    clearUsersByRole: (state, action: PayloadAction<string>) => {
      delete state.usersByRole[action.payload]
    },
    clearAllCache: (state) => {
      state.learnersList = null
      state.usersByRole = {}
    },
  },
})

export const {
  setLearnersList,
  setUsersByRole,
  clearLearnersList,
  clearUsersByRole,
  clearAllCache,
} = cacheSlice.actions

// Selectors
export const selectLearnersList = (state: RootState) => state.cache.learnersList
export const selectUsersByRole = (state: RootState, role: string) =>
  state.cache.usersByRole[role] || null
export const selectAllCachedUsers = (state: RootState) => state.cache.usersByRole

export default cacheSlice.reducer

