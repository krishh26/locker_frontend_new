"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/app/[locale]/(admin-root)/qa-sample-plan/utils/constants";
import type { UnitWithHistory } from "../hooks/use-iv-report-data";

interface UnitTabsProps {
  unit: UnitWithHistory;
  activeTab: number;
  onTabChange: (value: number) => void;
  onBack: () => void;
}

export function UnitTabs({ unit, activeTab, onTabChange, onBack }: UnitTabsProps) {
  const sampleHistory = Array.isArray(unit.sample_history) ? unit.sample_history : [];
  const activeTabString = String(activeTab);

  const handleTabChange = (value: string) => {
    onTabChange(Number(value));
  };

  return (
    <div className="flex items-center justify-between px-6 pb-4 border-b gap-4">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          {sampleHistory.length > 0 ? (
            <Tabs value={activeTabString} onValueChange={handleTabChange} className="w-full">
              <TabsList className="overflow-x-auto">
                {sampleHistory.map((item, index) => {
                  const plannedDate = item.planned_date || "";
                  const sampleType = item.sample_type || "";
                  return (
                    <TabsTrigger
                      key={`sample-${index}-${item.detail_id || index}`}
                      value={String(index)}
                      className="whitespace-nowrap"
                    >
                      FS {index + 1} - {plannedDate ? formatDate(plannedDate) : "No Date"}
                      {sampleType && ` (${sampleType})`}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          ) : (
            <div className="text-sm text-muted-foreground">No sample history available</div>
          )}
        </div>
      </div>
    </div>
  );
}
