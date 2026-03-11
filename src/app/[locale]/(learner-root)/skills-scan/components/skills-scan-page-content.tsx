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
import { useTranslations } from "next-intl";

export function SkillsScanPageContent() {
  const t = useTranslations("skillsScan");
  const user = useAppSelector((state) => state.auth.user);
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const [activeTab, setActiveTab] = useState("units");

  const userName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      t("userCard.fallbackUserName")
    : t("userCard.fallbackUserName");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const tabs = [
    {
      id: "units",
      label: t("tabs.units.label"),
      shortLabel: t("tabs.units.shortLabel"),
      icon: FileBarChart,
      description: t("tabs.units.description"),
      disabled: false,
    },
    {
      id: "questionnaire",
      label: t("tabs.questionnaire.label"),
      shortLabel: t("tabs.questionnaire.shortLabel"),
      icon: FileQuestion,
      description: t("tabs.questionnaire.description"),
      disabled: !selectedCourse,
    },
    {
      id: "results",
      label: t("tabs.results.label"),
      shortLabel: t("tabs.results.shortLabel"),
      icon: Eye,
      description: t("tabs.results.description"),
      disabled: !selectedCourse,
    },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Page Header */}
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
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
                  {t("userCard.summaryLine")}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
            >
              <CheckCircle2 className="mr-2 size-4" />
              {t("userCard.badge")}
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
                  <span className="sm:hidden">{tab.shortLabel}</span>
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

