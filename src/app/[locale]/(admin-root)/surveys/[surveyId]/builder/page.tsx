import { use } from "react"
import { SurveyBuilder } from "./components/survey-builder"

interface BuilderPageProps {
  params: Promise<{ surveyId: string }>
}

export default function BuilderPage({ params }: BuilderPageProps) {
  const { surveyId } = use(params)
  return <SurveyBuilder surveyId={surveyId} />
}

