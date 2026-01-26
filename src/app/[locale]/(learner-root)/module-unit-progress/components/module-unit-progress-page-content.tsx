"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleUnitProgressLearnerInfoCard } from "./module-unit-progress-learner-info-card";
import { ModuleUnitProgressDataTable } from "./module-unit-progress-data-table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import { useGetLearnerUnitsProgressQuery } from "@/store/api/module-unit-progress/moduleUnitProgressApi";
import { Card, CardContent } from "@/components/ui/card";

export function ModuleUnitProgressPageContent() {
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const learner = useAppSelector((state) => state.auth.learner);
  const learnerId = learner?.learner_id;

  const {
    data: progressData,
    isLoading,
    error,
  } = useGetLearnerUnitsProgressQuery(
    {
      learner_id: learnerId!,
      course_id: currentCourseId!,
    },
    {
      skip: !learnerId || !currentCourseId,
    }
  );

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Unit Progress"
        subtitle="Track learner progress across units"
        icon={BookOpen}
        showBackButton
        backButtonHref={`/course-details/${currentCourseId}`}
      />

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              Failed to load unit progress. Please try again later.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learner Information Card */}
      <ModuleUnitProgressLearnerInfoCard isLoading={isLoading} />

      {/* Data Table */}
      <div className="@container/main">
        <ModuleUnitProgressDataTable
          units={progressData?.units}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

