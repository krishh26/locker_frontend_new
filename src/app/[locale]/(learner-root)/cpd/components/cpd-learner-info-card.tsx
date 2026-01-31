"use client";

import { Users, Briefcase, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

function MetricCard({ title, value, icon: Icon, className }: MetricCardProps) {
  return (
    <Card className={cn("relative overflow-hidden border shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CpdLearnerInfoCard() {
  const user = useAppSelector((state) => state.auth.user);
  const learner = useAppSelector((state) => state.auth.learner);

  const learnerName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Not specified"
    : "Not specified";

  // Get job title and employer from learner data
  const jobTitle = learner?.job_title || "Not specified";
  
  const employerName = 
    learner?.employer_id && typeof learner.employer_id === "object" && "employer_name" in learner.employer_id
      ? learner.employer_id.employer_name
      : "Not specified";

  const learnerInfo = [
    {
      title: "Learner Name",
      value: learnerName,
      icon: Users,
    },
    {
      title: "Job Title",
      value: jobTitle,
      icon: Briefcase,
    },
    {
      title: "Employer",
      value: employerName,
      icon: Building2,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
      {learnerInfo.map((info) => (
        <MetricCard
          key={info.title}
          title={info.title}
          value={info.value}
          icon={info.icon}
        />
      ))}
    </div>
  );
}

