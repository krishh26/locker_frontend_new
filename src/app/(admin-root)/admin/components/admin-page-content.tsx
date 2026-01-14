"use client";

import Link from "next/link";

import { Building2, BookOpen, GraduationCap, Megaphone, Settings, Users } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminModule {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

const adminModules: AdminModule[] = [
  {
    title: "User Management",
    description: "Efficiently manage users with streamlined operations including add, delete, and update functionalities.",
    href: "/users",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Learner Management",
    description: "Optimize learner administration by seamlessly adding, updating, and deleting learners, while also facilitating the assignment of courses, trainers, employers, IQAs, and EQAs.",
    href: "/learners",
    icon: GraduationCap,
    color: "text-green-600",
  },
  {
    title: "Employer Management",
    description: "Manage employer information, add, update, and delete employer records, and assign learners to employers.",
    href: "/employers",
    icon: Building2,
    color: "text-purple-600",
  },
  {
    title: "Broadcast Management",
    description: "Create and manage broadcast messages, send notifications to users, learners, or specific courses.",
    href: "/broadcast",
    icon: Megaphone,
    color: "text-orange-600",
  },
  {
    title: "Course Builder",
    description: "Create, manage, and organize your courses with ease",
    href: "/course-builder",
    icon: BookOpen,
    color: "text-indigo-600",
  },
];

export function AdminPageContent() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Admin Modules"
        subtitle="Manage all administrative functions and system configurations"
        icon={Settings}
      />

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="group transition-all duration-200 hover:scale-[1.02]"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50">
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
                    <span>View Details</span>
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

