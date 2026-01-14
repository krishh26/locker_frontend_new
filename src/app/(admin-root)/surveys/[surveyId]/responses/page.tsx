import { use } from "react"
import { ResponsesTable } from "./components/responses-table"

interface ResponsesPageProps {
  params: Promise<{ surveyId: string }>
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { surveyId } = use(params)
  return <ResponsesTable surveyId={surveyId} />
}

