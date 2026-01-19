// Re-export portfolio cards from shared config
export {
  portfolioCards,
  courseCards,
  gatewayCards,
  type PortfolioCard,
} from "@/config/portfolio-cards"

export type CourseInfo = {
  course_id: number
  course_name: string
  course_code: string
  level: string
  sector: string
  qualification_type?: string
  recommended_minimum_age?: string
  total_credits?: string
  operational_start_date?: string
  guided_learning_hours?: string
  brand_guidelines?: string
  qualification_status?: string
  overall_grading_type?: string
  course_core_type?: string
}

export type UserCourseData = {
  user_course_id: number
  course: CourseInfo
  course_status: string
  start_date: string
  end_date: string
  trainer_id?: Supervisor
  IQA_id?: Supervisor
  LIQA_id?: Supervisor
  EQA_id?: Supervisor
  employer_id?: Supervisor
}

export type Supervisor = {
  user_id: string
  first_name: string
  last_name: string
  email: string
  mobile?: string
  avatar?: {
    url?: string
  }
  role?: string[]
  employer?: {
    employer_name: string
  }
}

export const courseStatusOptions = [
  "Awaiting Induction",
  "Certificated",
  "Completed",
  "Early Leaver",
  "Exempt",
  "In Training",
  "IQA Approved",
  "Training Suspended",
  "Transferred",
]

export function getUniqueUserData(courseData: UserCourseData): Supervisor[] {
  const users = [
    courseData.EQA_id ? { ...courseData.EQA_id, role: ["EQA"] } : null,
    courseData.IQA_id ? { ...courseData.IQA_id, role: ["IQA"] } : null,
    courseData.LIQA_id ? { ...courseData.LIQA_id, role: ["LIQA"] } : null,
    courseData.employer_id ? { ...courseData.employer_id, role: ["Employer"] } : null,
    courseData.trainer_id ? { ...courseData.trainer_id, role: ["Trainer"] } : null,
  ].filter(Boolean) as Supervisor[]

  const uniqueUsers = users.reduce((acc, user) => {
    const userId = user.user_id
    if (!userId) return acc
    
    if (acc[userId]) {
      acc[userId] = { ...user, role: [...(acc[userId].role || []), ...(user.role || [])] }
    } else {
      acc[userId] = user
    }
    return acc
  }, {} as Record<string, Supervisor>)

  return Object.values(uniqueUsers)
}
