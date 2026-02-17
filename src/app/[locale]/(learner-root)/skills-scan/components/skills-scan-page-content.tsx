"use client";

import { useState } from "react";
import { FileBarChart, CheckCircle2, Eye, FileQuestion } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/store/hooks";
import { selectSelectedCourse } from "@/store/slices/skillsScanSlice";
import { SkillsScanTnaUnits } from "./skills-scan-tna-units";
import { SkillsScanTnaQuestionnaire } from "./skills-scan-tna-questionnaire";
import { SkillsScanViewResults } from "./skills-scan-view-results";
import { cn } from "@/lib/utils";

export function SkillsScanPageContent() {
  const user = useAppSelector((state) => state.auth.user);
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const [activeTab, setActiveTab] = useState("units");

  const userName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"
    : "User";

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const tabs = [
    {
      id: "units",
      label: "Choose TNA Units",
      icon: FileBarChart,
      description: "Select your training units",
      disabled: false,
    },
    {
      id: "questionnaire",
      label: "TNA Questionnaire",
      icon: FileQuestion,
      description: "Complete the assessment",
      disabled: !selectedCourse,
    },
    {
      id: "results",
      label: "View Results",
      icon: Eye,
      description: "Review your results",
      disabled: !selectedCourse,
    },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title="Skills Assessment"
        subtitle="Training Needs Analysis"
        icon={FileBarChart}
      />

      {/* User Info Card */}
      <Card className="overflow-hidden border-0 bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
        <CardContent className="relative p-6">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/20 text-lg font-semibold text-primary-foreground">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{userName}</h2>
                <p className="text-primary-foreground/80 text-sm">
                  Skills Assessment & Training Needs Analysis
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
            >
              <CheckCircle2 className="mr-2 size-4" />
              Training Needs Analysis
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Card className="border shadow-sm">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-muted p-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={tab.disabled}
                  className={cn(
                    "flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background",
                    tab.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="units" className="mt-0 p-6">
            <SkillsScanTnaUnits onTabChange={handleTabChange} />
          </TabsContent>

          <TabsContent value="questionnaire" className="mt-0 p-6">
            <SkillsScanTnaQuestionnaire onTabChange={handleTabChange} />
          </TabsContent>

          <TabsContent value="results" className="mt-0 p-6">
            <SkillsScanViewResults />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

