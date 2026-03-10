"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface UnitProgress {
  pendingTrainerMap: number;
  pendingIqaMap: number;
  iqaChecked: number;
  total: number;
}

interface UnitProgressSectionProps {
  unitProgress: UnitProgress;
}

export function UnitProgressSection({ unitProgress }: UnitProgressSectionProps) {
  const t = useTranslations("qaSamplePlan.evidence.unitProgress");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Pending Trainer Map */}
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <div className="h-4 w-4 rounded-full bg-primary" />
            <span className="text-sm font-medium">{t("pendingTrainerMap")}:</span>
            <span className="text-sm font-semibold text-primary">
              {unitProgress.pendingTrainerMap}
            </span>
          </div>

          {/* Pending IQA Map */}
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <div className="h-4 w-4 rounded-full bg-secondary" />
            <span className="text-sm font-medium">{t("pendingIqaMap")}:</span>
            <span className="text-sm font-semibold text-secondary">
              {unitProgress.pendingIqaMap}
            </span>
          </div>

          {/* IQA Checked */}
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <div className="h-4 w-4 rounded-full bg-accent" />
            <span className="text-sm font-medium">{t("iqaChecked")}:</span>
            <span className="text-sm font-semibold text-accent">
              {unitProgress.iqaChecked}
            </span>
          </div>

          {/* Total Evidence */}
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <span className="text-sm font-medium">{t("totalEvidence")}:</span>
            <span className="text-sm font-semibold">{unitProgress.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
