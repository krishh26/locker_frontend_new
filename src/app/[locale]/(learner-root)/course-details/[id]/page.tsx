"use client"

import { use } from "react"
import { CourseDetailsPageContent } from "./components/course-details-page-content"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CourseDetailsPage({ params }: PageProps) {
  const { id } = use(params)
  return <CourseDetailsPageContent courseId={id} />
}

