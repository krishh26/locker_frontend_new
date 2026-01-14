import { type Question } from "@/store/slices/surveySlice"

export interface SurveyTemplate {
  id: string
  name: string
  description: string
  background: {
    type: "gradient" | "image"
    value: string // CSS gradient or image URL
  }
  questions: Omit<Question, "id" | "surveyId" | "order">[]
}

export const surveyTemplates: SurveyTemplate[] = [
  {
    id: "employee-satisfaction",
    name: "Employee Satisfaction Survey",
    description: "Gather feedback on employee satisfaction, work environment, and engagement",
    background: {
      type: "image",
      value: "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    questions: [
      {
        title: "How satisfied are you with your current role?",
        description: "Please rate your overall satisfaction",
        type: "rating",
        required: true,
      },
      {
        title: "How would you rate your work-life balance?",
        description: "Consider your workload and personal time",
        type: "rating",
        required: true,
      },
      {
        title: "What aspects of your job do you enjoy most?",
        description: "Select all that apply",
        type: "checkbox",
        required: false,
        options: [
          "Challenging projects",
          "Team collaboration",
          "Career growth opportunities",
          "Work flexibility",
          "Company culture",
          "Compensation and benefits",
        ],
      },
      {
        title: "How likely are you to recommend this company as a great place to work?",
        description: "Rate from 1 (not likely) to 5 (very likely)",
        type: "rating",
        required: true,
      },
      {
        title: "What improvements would you suggest?",
        description: "Please share your thoughts and suggestions",
        type: "long-text",
        required: false,
      },
      {
        title: "Which department do you work in?",
        description: "Select your department",
        type: "multiple-choice",
        required: true,
        options: [
          "Engineering",
          "Product",
          "Sales",
          "Marketing",
          "HR",
          "Operations",
          "Finance",
          "Other",
        ],
      },
    ],
  },
  {
    id: "customer-feedback",
    name: "Customer Feedback Survey",
    description: "Collect valuable insights about customer experience and satisfaction",
    background: {
      type: "gradient",
      value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    questions: [
      {
        title: "How satisfied are you with our product/service?",
        description: "Your honest feedback helps us improve",
        type: "rating",
        required: true,
      },
      {
        title: "How likely are you to recommend us to a friend or colleague?",
        description: "Rate from 1 (not likely) to 5 (very likely)",
        type: "rating",
        required: true,
      },
      {
        title: "What features do you find most valuable?",
        description: "Select all that apply",
        type: "checkbox",
        required: false,
        options: [
          "Ease of use",
          "Performance",
          "Customer support",
          "Pricing",
          "Features and functionality",
          "Design and user interface",
        ],
      },
      {
        title: "What is your primary use case?",
        description: "Select the option that best describes how you use our product",
        type: "multiple-choice",
        required: true,
        options: [
          "Personal use",
          "Small business",
          "Enterprise",
          "Education",
          "Non-profit",
          "Other",
        ],
      },
      {
        title: "What could we do better?",
        description: "Please share any suggestions or areas for improvement",
        type: "long-text",
        required: false,
      },
      {
        title: "How did you first hear about us?",
        description: "Help us understand our marketing effectiveness",
        type: "multiple-choice",
        required: false,
        options: [
          "Social media",
          "Search engine",
          "Friend or colleague",
          "Advertisement",
          "Blog or article",
          "Other",
        ],
      },
    ],
  },
]

