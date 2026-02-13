"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar } from "lucide-react";
import type { UnitWithHistory } from "../hooks/use-iv-report-data";
import { formatDate } from "@/app/[locale]/(admin-root)/qa-sample-plan/utils/constants";

interface UnitCardsProps {
  units: UnitWithHistory[];
  onUnitSelect: (unit: UnitWithHistory) => void;
  isLoading?: boolean;
}

export function UnitCards({ units, onUnitSelect, isLoading }: UnitCardsProps) {
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
          <p className="text-muted-foreground">No units found for this course.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => {
        const unitCode: string = String(unit.unit_code || unit.code || "");
        const unitName: string = String(unit.unit_name || "");
        const status: string = String(unit.status || "Not Started");
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
                {unitCode || "No Code"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {unitName || "No unit name"}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    status === "Completed"
                      ? "px-2 py-1 rounded bg-accent/10 text-accent"
                      : status === "In Progress"
                      ? "px-2 py-1 rounded bg-primary/10 text-primary"
                      : "px-2 py-1 rounded bg-muted text-muted-foreground"
                  }
                >
                  {status}
                </span>
                <span className="text-muted-foreground">
                  {sampleHistoryCount} sample{sampleHistoryCount !== 1 ? "s" : ""}
                </span>
              </div>
              {latestSample?.planned_date ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Last: {formatDate(latestSample.planned_date)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
