"use client";

import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { LearnersDataTable } from "./learners-data-table";
import { useAppSelector } from "@/store/hooks";

export function LearnersPageContent() {
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const isAdmin = userRole === "Admin";

  const title = "Learner Management";
  const subtitle = isAdmin
    ? "Optimize learner administration by seamlessly adding, updating, and deleting learners, while also facilitating the assignment of courses, trainers, employers, IQAs, and EQAs"
    : "Manage and monitor your assigned learners";

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={GraduationCap}
        showBackButton={isAdmin}
        backButtonHref={isAdmin ? "/admin" : "/learner-overview"}
      />

      {/* Data Table */}
      <div className="@container/main">
        <LearnersDataTable />
      </div>
    </div>
  );
}

