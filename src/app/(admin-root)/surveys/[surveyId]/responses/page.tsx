"use client"

import { use, useState } from "react"
import { ResponsesTable } from "./components/responses-table"
import { ResponsesOverview } from "./components/responses-overview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  useGetSurveyByIdQuery,
} from "@/store/api/survey/surveyApi"

interface ResponsesPageProps {
  params: Promise<{ surveyId: string }>
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { surveyId } = use(params)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch survey for header
  const { data: surveyResponse } = useGetSurveyByIdQuery(surveyId, {
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const survey = surveyResponse?.data?.survey

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={survey ? `${survey.name} - Responses` : "Survey Responses"}
        subtitle="View and analyze survey responses"
        showBackButton
        backButtonHref="/surveys"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Responses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <ResponsesOverview surveyId={surveyId} />
        </TabsContent>
        
        <TabsContent value="individual" className="mt-6">
          <ResponsesTable surveyId={surveyId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

