import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

type CourseState = {
  currentCourseId: number | null
}

const initialState: CourseState = {
  currentCourseId: null,
}

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCurrentCourseId: (state, action: PayloadAction<number | null>) => {
      state.currentCourseId = action.payload
    },
    clearCurrentCourseId: (state) => {
      state.currentCourseId = null
    },
  },
})

export const { setCurrentCourseId, clearCurrentCourseId } = courseSlice.actions

export const selectCurrentCourseId = (state: RootState) => state.course.currentCourseId

export default courseSlice.reducer
