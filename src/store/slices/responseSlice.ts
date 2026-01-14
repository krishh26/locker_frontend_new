import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

export interface Response {
  id: string
  surveyId: string
  answers: Record<string, string | string[] | null> // questionId → answer value
  submittedAt: string
}

type ResponseState = {
  responses: Record<string, Response[]> // surveyId → responses[]
}

const initialState: ResponseState = {
  responses: {},
}

const responseSlice = createSlice({
  name: "response",
  initialState,
  reducers: {
    addResponse: (state, action: PayloadAction<Omit<Response, "id" | "submittedAt">>) => {
      const surveyId = action.payload.surveyId
      if (!state.responses[surveyId]) {
        state.responses[surveyId] = []
      }
      const newResponse: Response = {
        ...action.payload,
        id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date().toISOString(),
      }
      state.responses[surveyId].push(newResponse)
    },
    deleteResponse: (state, action: PayloadAction<{ id: string; surveyId: string }>) => {
      const responses = state.responses[action.payload.surveyId]
      if (responses) {
        state.responses[action.payload.surveyId] = responses.filter(
          (r) => r.id !== action.payload.id
        )
      }
    },
    setResponses: (state, action: PayloadAction<{ surveyId: string; responses: Response[] }>) => {
      state.responses[action.payload.surveyId] = action.payload.responses
    },
  },
})

export const { addResponse, deleteResponse, setResponses } = responseSlice.actions

// Selectors
export const selectResponsesBySurveyId = (state: RootState, surveyId: string) =>
  state.response.responses[surveyId] || []
export const selectResponseById = (state: RootState, surveyId: string, responseId: string) => {
  const responses = state.response.responses[surveyId] || []
  return responses.find((r) => r.id === responseId)
}

export default responseSlice.reducer

