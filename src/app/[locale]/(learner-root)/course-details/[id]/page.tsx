import { CourseDetailsPageContent } from "./components/course-details-page-content"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CourseDetailsPage({ params }: PageProps) {
  const { id } = await params
  return <CourseDetailsPageContent courseId={id} />
}
