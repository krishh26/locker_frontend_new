"use client";

import { User, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { useLazyGetLearnerDetailsQuery } from "@/store/api/learner/learnerApi";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

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
            <div className="rounded-lg bg-primary p-2">
              <Icon className="h-5 w-5 text-white" />
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

export function ModuleUnitProgressLearnerInfoCard() {
    const t = useTranslations("gapAnalysis");
    const leaner = useAppSelector((state) => state.auth.learner);
    console.log("🚀 ~ ModuleUnitProgressLearnerInfoCard ~ leaner:", leaner)
//   const [getLearnerDetails, { data: progressData, isLoading }] =
//     useLazyGetLearnerDetailsQuery();

//   useEffect(() => {
//     if (user?.id) {
//       getLearnerDetails(user.id);
//     }
//   }, [user?.id, getLearnerDetails]);

//   const learner = progressData?.data;
  const learnerName = leaner?.first_name + " " + leaner?.last_name;

  const learnerInfo = [
    {
      title: t("learnerInfo.name"),
      value: learnerName,
      icon: User,
    },
    {
      title: t("learnerInfo.username"),
      value: leaner?.user_name || t("learnerInfo.notSpecified"),
      icon: User,
    },
    {
      title: t("learnerInfo.email"),
      value: leaner?.email || t("learnerInfo.notSpecified"),
      icon: Mail,
    },
    {
      title: t("learnerInfo.mobile"),
      value: leaner?.mobile || t("learnerInfo.notSpecified"),
      icon: Phone,
    },
  ];

//   if (isLoading) {
//     return (
//       <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
//         {[1, 2, 3, 4].map((i) => (
//           <Card key={i} className="animate-pulse">
//             <CardContent className="p-6">
//               <div className="h-20 bg-muted rounded" />
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     );
//   }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {learnerInfo.map((info) => (
        <MetricCard
          key={info.title}
          title={info.title}
          value={info.value as unknown as string}
          icon={info.icon}
        />
      ))}
    </div>
  );
}

