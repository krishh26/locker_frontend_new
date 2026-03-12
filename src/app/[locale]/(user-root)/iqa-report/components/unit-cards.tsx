"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar } from "lucide-react";
import type { UnitWithHistory } from "../hooks/use-iv-report-data";
import { formatDate } from "@/app/[locale]/(admin-root)/qa-sample-plan/utils/constants";
import { useTranslations } from "next-intl";

interface UnitCardsProps {
  units: UnitWithHistory[];
  onUnitSelect: (unit: UnitWithHistory) => void;
  isLoading?: boolean;
}

export function UnitCards({ units, onUnitSelect, isLoading }: UnitCardsProps) {
  const t = useTranslations("iqaReport");
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t("unitCards.noUnitsForCourse")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => {
        const unitCode: string = String(unit.unit_code || unit.code || "");
        const unitName: string = String(unit.unit_name || "");
        const rawStatus: string = String(unit.status || "");
        const status: string = rawStatus || t("unitCards.notStarted");
        const displayStatus =
          rawStatus === "Completed"
            ? t("unitCards.completed")
            : rawStatus === "In Progress"
            ? t("unitCards.inProgress")
            : rawStatus === "Not Started" || !rawStatus
            ? t("unitCards.notStarted")
            : rawStatus;
        const sampleHistoryCount = Array.isArray(unit.sample_history) ? unit.sample_history.length : 0;
        const latestSample = Array.isArray(unit.sample_history) && unit.sample_history.length > 0
          ? unit.sample_history[unit.sample_history.length - 1]
          : null;

        return (
          <Card
            key={unitCode || String(unit.unit_code || unit.code || Math.random())}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onUnitSelect(unit)}
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {unitCode || t("unitCards.noCode")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {unitName || t("unitCards.noUnitName")}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    rawStatus === "Completed"
                      ? "px-2 py-1 rounded bg-accent text-white"
                      : rawStatus === "In Progress"
                      ? "px-2 py-1 rounded bg-primary text-white"
                      : "px-2 py-1 rounded bg-muted text-muted-foreground"
                  }
                >
                  {displayStatus}
                </span>
                <span className="text-muted-foreground">
                  {sampleHistoryCount} {sampleHistoryCount !== 1 ? t("unitCards.samples") : t("unitCards.sample")}
                </span>
              </div>
              {latestSample?.planned_date ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{t("unitCards.last")}: {formatDate(latestSample.planned_date)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
