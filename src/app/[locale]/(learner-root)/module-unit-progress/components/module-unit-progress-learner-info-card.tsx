"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LearnerUnitProgressData } from "@/store/api/module-unit-progress/types";

interface ModuleUnitProgressLearnerInfoCardProps {
  data?: LearnerUnitProgressData;
  isLoading?: boolean;
}

export function ModuleUnitProgressLearnerInfoCard({
  data,
  isLoading,
}: ModuleUnitProgressLearnerInfoCardProps) {
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

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No learner information available</p>
        </CardContent>
      </Card>
    );
  }

  const infoItems = [
    { label: "Learner", value: data.learner_name || "-" },
    { label: "ULN", value: data.uln || "-" },
    { label: "Registration Number", value: data.registration_number || "-" },
    { label: "Training Provider", value: data.training_provider || "-" },
    { label: "Course Name", value: data.course_name || "-" },
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

