import { type Question, type Response } from "@/store/api/survey/surveyApi"

export interface AggregatedOption {
  option: string
  count: number
  percentage: number
}

export interface AggregatedRating {
  rating: number
  count: number
  percentage: number
}

export interface LikertStatementData {
  statement: string
  statementIndex: number
  options: AggregatedOption[]
}

export interface AggregatedLikert {
  statements: LikertStatementData[]
}

export interface TextResponse {
  text: string
  submittedAt: string
}

/**
 * Aggregate multiple choice question responses
 */
export function aggregateMultipleChoice(
  question: Question,
  responses: Response[]
): AggregatedOption[] {
  if (!question.options) return []

  const counts: Record<string, number> = {}
  question.options.forEach((option) => {
    counts[option] = 0
  })

  let totalAnswers = 0
  responses.forEach((response) => {
    const answer = response.answers[question.id]
    if (typeof answer === "string" && counts[answer] !== undefined) {
      counts[answer]++
      totalAnswers++
    }
  })

  return question.options.map((option) => ({
    option,
    count: counts[option],
    percentage: totalAnswers > 0 ? (counts[option] / totalAnswers) * 100 : 0,
  }))
}

/**
 * Aggregate checkbox question responses
 */
export function aggregateCheckbox(
  question: Question,
  responses: Response[]
): AggregatedOption[] {
  if (!question.options) return []

  const counts: Record<string, number> = {}
  question.options.forEach((option) => {
    counts[option] = 0
  })

  let totalSelections = 0
  responses.forEach((response) => {
    const answer = response.answers[question.id]
    if (Array.isArray(answer)) {
      answer.forEach((option) => {
        if (counts[option] !== undefined) {
          counts[option]++
          totalSelections++
        }
      })
    }
  })

  return question.options.map((option) => ({
    option,
    count: counts[option],
    percentage: totalSelections > 0 ? (counts[option] / totalSelections) * 100 : 0,
  }))
}

/**
 * Aggregate rating question responses
 */
export function aggregateRating(
  question: Question,
  responses: Response[]
): {
  distribution: AggregatedRating[]
  average: number
  total: number
} {
  const counts: Record<number, number> = {}
  let totalAnswers = 0
  let sum = 0

  // Initialize counts for ratings 1-5
  for (let i = 1; i <= 5; i++) {
    counts[i] = 0
  }

  responses.forEach((response) => {
    const answer = response.answers[question.id]
    if (typeof answer === "string") {
      const rating = parseInt(answer, 10)
      if (rating >= 1 && rating <= 5) {
        counts[rating]++
        totalAnswers++
        sum += rating
      }
    }
  })

  const distribution: AggregatedRating[] = []
  for (let i = 1; i <= 5; i++) {
    distribution.push({
      rating: i,
      count: counts[i],
      percentage: totalAnswers > 0 ? (counts[i] / totalAnswers) * 100 : 0,
    })
  }

  return {
    distribution,
    average: totalAnswers > 0 ? sum / totalAnswers : 0,
    total: totalAnswers,
  }
}

/**
 * Aggregate Likert scale question responses
 */
export function aggregateLikert(
  question: Question,
  responses: Response[]
): AggregatedLikert {
  if (!question.statements || !question.options) {
    return { statements: [] }
  }

  const statementsData: LikertStatementData[] = question.statements.map(
    (statement, statementIndex) => {
      const counts: Record<string, number> = {}
      question.options!.forEach((option) => {
        counts[option] = 0
      })

      let totalAnswers = 0
      responses.forEach((response) => {
        const answer = response.answers[question.id]
        if (typeof answer === "object" && !Array.isArray(answer) && answer !== null) {
          const statementKey = String(statementIndex)
          const selectedOption = answer[statementKey]
          if (typeof selectedOption === "string" && counts[selectedOption] !== undefined) {
            counts[selectedOption]++
            totalAnswers++
          }
        }
      })

      const options: AggregatedOption[] = question.options!.map((option) => ({
        option,
        count: counts[option],
        percentage: totalAnswers > 0 ? (counts[option] / totalAnswers) * 100 : 0,
      }))

      return {
        statement,
        statementIndex,
        options,
      }
    }
  )

  return { statements: statementsData }
}

/**
 * Aggregate date question responses
 */
export function aggregateDate(
  question: Question,
  responses: Response[]
): AggregatedOption[] {
  const dateRanges: Record<string, number> = {}
  let totalAnswers = 0

  const getDateRange = (dateStr: string): string => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "Yesterday"
      if (diffDays <= 7) return "Last 7 days"
      if (diffDays <= 30) return "Last 30 days"
      if (diffDays <= 90) return "Last 3 months"
      if (diffDays <= 365) return "Last year"
      return "Over a year ago"
    } catch {
      return "Invalid date"
    }
  }

  responses.forEach((response) => {
    const answer = response.answers[question.id]
    if (typeof answer === "string") {
      const range = getDateRange(answer)
      dateRanges[range] = (dateRanges[range] || 0) + 1
      totalAnswers++
    }
  })

  return Object.entries(dateRanges).map(([range, count]) => ({
    option: range,
    count,
    percentage: totalAnswers > 0 ? (count / totalAnswers) * 100 : 0,
  }))
}

/**
 * Get text responses for text questions
 */
export function getTextResponses(
  question: Question,
  responses: Response[]
): TextResponse[] {
  const textResponses: TextResponse[] = []

  responses.forEach((response) => {
    const answer = response.answers[question.id]
    if (typeof answer === "string" && answer.trim()) {
      textResponses.push({
        text: answer,
        submittedAt: response.submittedAt,
      })
    }
  })

  // Sort by most recent first
  return textResponses.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )
}

/**
 * Calculate average response time (if timestamps are available)
 */
export function calculateAverageTime(responses: Response[]): string {
  if (responses.length === 0) return "00:00"

  // This is a placeholder - actual implementation depends on if response time data is available
  // For now, we'll return a default or calculate based on available metadata
  // You might need to adjust this based on your API response structure
  return "00:23" // Placeholder format MM:SS
}

/**
 * Calculate duration in days between first and last response
 */
export function calculateDuration(responses: Response[]): number {
  if (responses.length < 2) return 0

  const dates = responses
    .map((r) => new Date(r.submittedAt).getTime())
    .filter((d) => !isNaN(d))
    .sort((a, b) => a - b)

  if (dates.length < 2) return 0

  const first = dates[0]
  const last = dates[dates.length - 1]
  const diffTime = Math.abs(last - first)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

