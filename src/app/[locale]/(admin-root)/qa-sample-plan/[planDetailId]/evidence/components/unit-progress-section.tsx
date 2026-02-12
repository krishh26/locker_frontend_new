"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Unit Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Pending Trainer Map */}
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <div className="h-4 w-4 rounded-full bg-primary" />
            <span className="text-sm font-medium">Pending Trainer Map:</span>
            <span className="text-sm font-semibold text-primary">
              {unitProgress.pendingTrainerMap}
            </span>
          </div>

          {/* Pending IQA Map */}
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <div className="h-4 w-4 rounded-full bg-secondary" />
            <span className="text-sm font-medium">Pending IQA Map:</span>
            <span className="text-sm font-semibold text-secondary">
              {unitProgress.pendingIqaMap}
            </span>
          </div>

          {/* IQA Checked */}
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <div className="h-4 w-4 rounded-full bg-accent" />
            <span className="text-sm font-medium">IQA Checked:</span>
            <span className="text-sm font-semibold text-accent">
              {unitProgress.iqaChecked}
            </span>
          </div>

          {/* Total Evidence */}
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <span className="text-sm font-medium">Total Evidence:</span>
            <span className="text-sm font-semibold">{unitProgress.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
