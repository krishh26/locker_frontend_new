import { PageHeader } from "@/components/dashboard/page-header";
import { ClipboardList } from "lucide-react";
import type { ReactNode } from "react";

export interface QASamplePlanLayoutProps {
  children: ReactNode;
}

export function QASamplePlanLayout({ children }: QASamplePlanLayoutProps) {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="QA Sample Plan"
        subtitle="Manage QA sample plans, learners, and associated actions."
        icon={ClipboardList}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {children}
      </div>
    </div>
  );
}
