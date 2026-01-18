import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

export interface Survey {
  id: string
  name: string
  description?: string
  status: "Draft" | "Published" | "Archived"
  createdAt: string
  updatedAt: string
  background?: {
    type: "gradient" | "image"
    value: string // CSS gradient or image URL
  }
}

export interface Question {
  id: string
  surveyId: string
  title: string
  description?: string
  type: "short-text" | "long-text" | "multiple-choice" | "checkbox" | "rating" | "date" | "likert"
  required: boolean
  options?: string[] | null
  order: number
  createdAt?: string
  updatedAt?: string
}

type SurveyState = {
  surveys: Survey[]
  questions: Record<string, Question[]> // surveyId → questions[]
}

const initialState: SurveyState = {
  surveys: [],
  questions: {},
}

const surveySlice = createSlice({
  name: "survey",
  initialState,
  reducers: {
    addSurvey: (state, action: PayloadAction<Omit<Survey, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const newSurvey: Survey = {
        ...action.payload,
        id: `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      }
      state.surveys.push(newSurvey)
      state.questions[newSurvey.id] = []
    },
    updateSurvey: (state, action: PayloadAction<{ id: string; updates: Partial<Omit<Survey, "id" | "createdAt">> }>) => {
      const survey = state.surveys.find((s) => s.id === action.payload.id)
      if (survey) {
        Object.assign(survey, action.payload.updates, {
          updatedAt: new Date().toISOString(),
        })
      }
    },
    deleteSurvey: (state, action: PayloadAction<string>) => {
      state.surveys = state.surveys.filter((s) => s.id !== action.payload)
      delete state.questions[action.payload]
    },
    addQuestion: (state, action: PayloadAction<Omit<Question, "id" | "order"> & { order?: number }>) => {
      const surveyId = action.payload.surveyId
      if (!state.questions[surveyId]) {
        state.questions[surveyId] = []
      }
      const existingQuestions = state.questions[surveyId]
      const maxOrder = existingQuestions.length > 0 
        ? Math.max(...existingQuestions.map((q) => q.order))
        : -1
      const newQuestion: Question = {
        ...action.payload,
        id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        order: action.payload.order ?? maxOrder + 1,
      }
      state.questions[surveyId].push(newQuestion)
      // Update survey updatedAt
      const survey = state.surveys.find((s) => s.id === surveyId)
      if (survey) {
        survey.updatedAt = new Date().toISOString()
      }
    },
    updateQuestion: (state, action: PayloadAction<{ id: string; surveyId: string; updates: Partial<Omit<Question, "id" | "surveyId" | "order">> }>) => {
      const questions = state.questions[action.payload.surveyId]
      if (questions) {
        const question = questions.find((q) => q.id === action.payload.id)
        if (question) {
          Object.assign(question, action.payload.updates)
          // Update survey updatedAt
          const survey = state.surveys.find((s) => s.id === action.payload.surveyId)
          if (survey) {
            survey.updatedAt = new Date().toISOString()
          }
        }
      }
    },
    deleteQuestion: (state, action: PayloadAction<{ id: string; surveyId: string }>) => {
      const questions = state.questions[action.payload.surveyId]
      if (questions) {
        state.questions[action.payload.surveyId] = questions.filter(
          (q) => q.id !== action.payload.id
        )
        // Reorder remaining questions
        state.questions[action.payload.surveyId].forEach((q, index) => {
          q.order = index
        })
        // Update survey updatedAt
        const survey = state.surveys.find((s) => s.id === action.payload.surveyId)
        if (survey) {
          survey.updatedAt = new Date().toISOString()
        }
      }
    },
    reorderQuestions: (state, action: PayloadAction<{ surveyId: string; questionIds: string[] }>) => {
      const questions = state.questions[action.payload.surveyId]
      if (questions) {
        // Create a map for quick lookup
        const questionMap = new Map(questions.map((q) => [q.id, q]))
        // Reorder based on the new order
        const reorderedQuestions = action.payload.questionIds
          .map((id) => questionMap.get(id))
          .filter((q): q is Question => q !== undefined)
        // Update orders
        reorderedQuestions.forEach((q, index) => {
          q.order = index
        })
        state.questions[action.payload.surveyId] = reorderedQuestions
        // Update survey updatedAt
        const survey = state.surveys.find((s) => s.id === action.payload.surveyId)
        if (survey) {
          survey.updatedAt = new Date().toISOString()
        }
      }
    },
    setQuestions: (state, action: PayloadAction<{ surveyId: string; questions: Question[] }>) => {
      state.questions[action.payload.surveyId] = action.payload.questions
    },
  },
})

export const {
  addSurvey,
  updateSurvey,
  deleteSurvey,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  setQuestions,
} = surveySlice.actions

// Selectors
export const selectAllSurveys = (state: RootState) => state.survey.surveys
export const selectSurveyById = (state: RootState, id: string) =>
  state.survey.surveys.find((s) => s.id === id)
export const selectQuestionsBySurveyId = (state: RootState, surveyId: string) =>
  state.survey.questions[surveyId] || []

export default surveySlice.reducer

