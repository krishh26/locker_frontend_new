import { PageHeader } from "@/components/dashboard/page-header";
import { ClipboardList } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export interface QASamplePlanLayoutProps {
  children: ReactNode;
}

export function QASamplePlanLayout({ children }: QASamplePlanLayoutProps) {
  const t = useTranslations("qaSamplePlan.layout");
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={ClipboardList}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {children}
      </div>
    </div>
  );
}
