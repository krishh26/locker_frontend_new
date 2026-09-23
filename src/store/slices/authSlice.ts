import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import type { LoginResult, AuthUser } from "@/store/api/auth/types"
import type { LearnerData, LearnerCourse } from "@/store/api/learner/types"
import { filterActiveLearnerCourses } from "@/store/api/learner/filter-active-courses"

export type AuthState = {
  token: string | null
  user: AuthUser | null
  passwordChanged: boolean
  error: string | null
  learner: LearnerData | null
  courses: LearnerCourse[]
}

/** State shape expected by auth selectors (avoids PersistPartial typing issues) */
type StateWithAuth = { auth: AuthState }

const initialState: AuthState = {
  token: null,
  user: null,
  passwordChanged: true,
  error: null,
  learner: null,
  courses: [],
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResult>) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.passwordChanged =
        action.payload.passwordChanged ?? state.passwordChanged
      state.error = null
    },
    clearCredentials: (state) => {
      state.token = null
      state.user = null
      state.passwordChanged = true
      state.error = null
      state.learner = null
      state.courses = []
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      if (!state.user) {
        state.user = action.payload
      } else {
        state.user = {
          ...state.user,
          ...action.payload,
        }
      }
    },
    setLearnerData: (state, action: PayloadAction<LearnerData | null>) => {
      if (action.payload === null) {
        state.learner = null
        state.courses = []
      } else {
        const course = filterActiveLearnerCourses(action.payload.course)
        state.learner = { ...action.payload, course }
        state.courses = course
      }
    },
    setCourses: (state, action: PayloadAction<LearnerCourse[]>) => {
      state.courses = filterActiveLearnerCourses(action.payload)
    },
  },
})

export const {
  setCredentials,
  clearCredentials,
  setAuthError,
  updateUser,
  setLearnerData,
  setCourses,
} = authSlice.actions

export const selectAuth = (state: StateWithAuth) => state.auth
export const selectAuthToken = (state: StateWithAuth) => state.auth.token
export const selectAuthUser = (state: StateWithAuth) => state.auth.user
export const selectAuthError = (state: StateWithAuth) => state.auth.error
export const selectLearner = (state: StateWithAuth) => {
  const learner = state.auth.learner
  if (!learner?.course) return learner
  return {
    ...learner,
    course: filterActiveLearnerCourses(learner.course),
  }
}
export const selectCourses = (state: StateWithAuth) =>
  filterActiveLearnerCourses(state.auth.courses)

export default authSlice.reducer

