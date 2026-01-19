"use client";

import { User, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { useLazyGetLearnerDetailsQuery } from "@/store/api/learner/learnerApi";
import { useEffect } from "react";

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

export function ModuleUnitProgressLearnerInfoCard() {
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
      title: "Name",
      value: learnerName,
      icon: User,
    },
    {
      title: "Username",
      value: leaner?.user_name || "Not specified",
      icon: User,
    },
    {
      title: "Email",
      value: leaner?.email || "Not specified",
      icon: Mail,
    },
    {
      title: "Mobile",
      value: leaner?.mobile || "Not specified",
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

