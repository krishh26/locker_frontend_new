"use client";

import Link from "next/link";
import { Shield, Settings, FileText, Key, Download, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MasterAdminModule {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

export function MasterAdminPageContent() {
  const masterAdminModules: MasterAdminModule[] = [
    {
      title: "Admin Management",
      description: "Create, edit, and manage Administrator user accounts",
      href: "/master-admin/admins",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings, email, and security policies",
      href: "/master-admin/system-settings",
      icon: Settings,
      color: "text-purple-600",
    },
    {
      title: "Audit Logs",
      description: "View system activity logs and user actions for compliance",
      href: "/master-admin/audit-logs",
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Role Permissions",
      description: "Manage role-based access control and permissions matrix",
      href: "/master-admin/role-permissions",
      icon: Key,
      color: "text-orange-600",
    },
    {
      title: "Data Export",
      description: "Export system data for backup and reporting purposes",
      href: "/master-admin/data-export",
      icon: Download,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Master Admin Dashboard"
        subtitle="System administration and configuration controls"
        icon={Shield}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Placeholder data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Ready for backend integration</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Export</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">No exports yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Master Admin Modules Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {masterAdminModules.map((module) => {
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
