import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

type CourseBuilderState = {
  courseType: string | null
}

const initialState: CourseBuilderState = {
  courseType: null,
}

const courseBuilderSlice = createSlice({
  name: "courseBuilder",
  initialState,
  reducers: {
    setCourseType: (state, action: PayloadAction<string>) => {
      state.courseType = action.payload
    },
    clearCourseType: (state) => {
      state.courseType = null
    },
  },
})

export const { setCourseType, clearCourseType } = courseBuilderSlice.actions

// Selectors
export const selectCourseType = (state: RootState) => state.courseBuilder.courseType

export default courseBuilderSlice.reducer
