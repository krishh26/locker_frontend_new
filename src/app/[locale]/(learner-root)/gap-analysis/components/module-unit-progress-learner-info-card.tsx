"use client";

import { User, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { selectLearner } from "@/store/slices/authSlice";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

function MetricCard({ title, value, icon: Icon, className }: MetricCardProps) {
  return (
    <Card className={cn("min-w-0 border shadow-sm", className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-lg bg-primary p-2">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className="break-words text-base font-bold tracking-tight sm:text-lg lg:text-xl"
              title={value}
            >
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModuleUnitProgressLearnerInfoCard() {
  const t = useTranslations("gapAnalysis");
  const learner = useAppSelector(selectLearner);

  const learnerName = [learner?.first_name, learner?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const learnerInfo = [
    {
      title: t("learnerInfo.name"),
      value: learnerName || t("learnerInfo.notSpecified"),
      icon: User,
    },
    {
      title: t("learnerInfo.username"),
      value: learner?.user_name || t("learnerInfo.notSpecified"),
      icon: User,
    },
    {
      title: t("learnerInfo.email"),
      value: learner?.email || t("learnerInfo.notSpecified"),
      icon: Mail,
    },
    {
      title: t("learnerInfo.mobile"),
      value: learner?.mobile || t("learnerInfo.notSpecified"),
      icon: Phone,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
