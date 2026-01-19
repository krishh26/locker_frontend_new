"use client"

import { use } from "react"
import { LearnerDashboardViewer } from "./components/learner-dashboard-viewer"

export default function LearnerDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <LearnerDashboardViewer learnerId={id} />
}

