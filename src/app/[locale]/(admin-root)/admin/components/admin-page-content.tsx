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
      color: "text-white",
      bgClass: "bg-primary border-primary",
    },
    {
      title: t("modules.learnerManagement.title"),
      description: t("modules.learnerManagement.description"),
      href: "/learners",
      icon: GraduationCap,
      color: "text-white",
      bgClass: "bg-secondary border-secondary",
    },
    {
      title: t("modules.employerManagement.title"),
      description: t("modules.employerManagement.description"),
      href: "/employers",
      icon: Building2,
      color: "text-white",
      bgClass: "bg-accent border-accent",
    },
    {
      title: t("modules.broadcastManagement.title"),
      description: t("modules.broadcastManagement.description"),
      href: "/broadcast",
      icon: Megaphone,
      color: "text-white",
      bgClass: "bg-muted border-border",
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
              <Card className={cn("h-full transition-all duration-200 hover:shadow-lg hover:border-white/30", module.bgClass)}>
                <CardHeader className="flex flex-col items-center text-center space-y-4 pb-4">
                  <div
                    className={cn(
                      "rounded-lg p-4 bg-white/10 group-hover:bg-white/20 transition-colors duration-200",
                      module.color
                    )}
                  >
                    <Icon className={cn("h-12 w-12", module.color)} />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-white group-hover:text-white/80 transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-white/70">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-center text-sm text-white/70 group-hover:text-white transition-colors">
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

