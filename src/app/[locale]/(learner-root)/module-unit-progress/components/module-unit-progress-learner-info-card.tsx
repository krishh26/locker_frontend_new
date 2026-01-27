"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import type { LearnerData } from "@/store/api/learner/types";

interface ModuleUnitProgressLearnerInfoCardProps {
  isLoading?: boolean;
}

export function ModuleUnitProgressLearnerInfoCard({
  isLoading,
}: ModuleUnitProgressLearnerInfoCardProps) {
  const learner = useAppSelector((state) => state.auth.learner);
  const currentCourseId = useAppSelector(selectCurrentCourseId);

  const courseName = useMemo(() => {
    if (!learner?.course || !currentCourseId) return "-";
    const course = learner.course.find(
      (c) => c.course?.course_id === currentCourseId
    );
    return course?.course?.course_name || "-";
  }, [learner?.course, currentCourseId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 flex-1 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!learner) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No learner information available</p>
        </CardContent>
      </Card>
    );
  }

  const learnerName = `${learner.first_name || ""} ${learner.last_name || ""}`.trim() || "-";
  const uln = (learner as LearnerData & { uln?: string }).uln || "-";
  const registrationNumber = (learner as LearnerData & { registration_number?: string }).registration_number || "-";
  const trainingProvider = (learner as LearnerData & { training_provider?: string }).training_provider || "-";

  const infoItems = [
    { label: "Learner", value: learnerName },
    { label: "ULN", value: uln },
    { label: "Registration Number", value: registrationNumber },
    { label: "Training Provider", value: trainingProvider },
    { label: "Course Name", value: courseName },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          {infoItems.map((item) => (
            <div key={item.label} className="flex gap-4">
              <span className="font-medium text-muted-foreground min-w-[180px]">
                {item.label}:
              </span>
              <span className="text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

