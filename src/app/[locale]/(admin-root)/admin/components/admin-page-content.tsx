"use client";

import Link from "next/link";

import { Building2, GraduationCap, Megaphone, Settings, Users } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AdminModule {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  bgClass?: string;
}

export function AdminPageContent() {
  const t = useTranslations("admin");
  
  const adminModules: AdminModule[] = [
    {
      title: t("modules.userManagement.title"),
      description: t("modules.userManagement.description"),
      href: "/users",
      icon: Users,
      color: "text-blue-600",
      bgClass: "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950/50 dark:to-blue-950/40 border-sky-300/60 dark:border-sky-800/30",
    },
    {
      title: t("modules.learnerManagement.title"),
      description: t("modules.learnerManagement.description"),
      href: "/learners",
      icon: GraduationCap,
      color: "text-green-600",
      bgClass: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-300/60 dark:border-emerald-800/30",
    },
    {
      title: t("modules.employerManagement.title"),
      description: t("modules.employerManagement.description"),
      href: "/employers",
      icon: Building2,
      color: "text-purple-600",
      bgClass: "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/50 dark:to-purple-950/40 border-violet-300/60 dark:border-violet-800/30",
    },
    {
      title: t("modules.broadcastManagement.title"),
      description: t("modules.broadcastManagement.description"),
      href: "/broadcast",
      icon: Megaphone,
      color: "text-orange-600",
      bgClass: "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/40 border-orange-300/60 dark:border-orange-800/30",
    },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Settings}
      />

      {/* Admin Management Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="group transition-all duration-200 hover:scale-[1.02]"
            >
              <Card className={cn("h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50", module.bgClass)}>
                <CardHeader className="flex flex-col items-center text-center space-y-4 pb-4">
                  <div
                    className={cn(
                      "rounded-lg p-4 bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200",
                      module.color
                    )}
                  >
                    <Icon className={cn("h-12 w-12", module.color)} />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <span>{t("viewDetails")}</span>
                    <svg
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

