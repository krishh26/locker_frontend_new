"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleUnitProgressLearnerInfoCard } from "./module-unit-progress-learner-info-card";
import { ModuleUnitProgressDataTable } from "./module-unit-progress-data-table";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import { useGetLearnerUnitsProgressQuery } from "@/store/api/module-unit-progress/moduleUnitProgressApi";
import { Card, CardContent } from "@/components/ui/card";
import { buildUnitProgressFromCourseUnits } from "../utils/build-unit-progress";

export function ModuleUnitProgressPageContent() {
  const t = useTranslations("moduleUnitProgress");
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const learner = useAppSelector((state) => state.auth.learner);
  const learnerId = learner?.learner_id;
  const courses = useAppSelector((state) => state.auth.courses);

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

  // course.units is part of the payload but absent from LearnerCourse's type.
  const course = courses.find(
    (entry) => entry?.course?.course_id === currentCourseId
  )?.course as
    | { course_core_type?: string | null; units?: unknown }
    | undefined;

  const isStandardCourse = course?.course_core_type === "Standard";

  // The API returns nothing when no Choose Units selection was saved (Standard
  // courses) or when a course edit changed the unit ids the selection points at.
  const units = useMemo(() => {
    const apiUnits = progressData?.units ?? [];
    if (apiUnits.length > 0) return apiUnits;

    return buildUnitProgressFromCourseUnits(course?.units);
  }, [progressData?.units, course?.units]);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        icon={BookOpen}
        showBackButton
        backButtonHref={`/course-details/${currentCourseId}`}
      />

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              {t("error.loadFailed")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learner Information Card */}
      <ModuleUnitProgressLearnerInfoCard isLoading={isLoading} />

      {/* Data Table */}
      <div className="@container/main">
        <ModuleUnitProgressDataTable
          units={units}
          isLoading={isLoading}
          isStandardCourse={isStandardCourse}
        />
      </div>
    </div>
  );
}

