"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/app/[locale]/(admin-root)/qa-sample-plan/utils/constants";
import type { UnitWithHistory } from "../hooks/use-iv-report-data";

interface UnitTabsProps {
  units: UnitWithHistory[];
  selectedUnitIndex: number;
  activeTabIndex: number;
  onUnitSelect: (unitIndex: number) => void;
  onTabChange: (tabIndex: number) => void;
}

export function UnitTabs({
  units,
  selectedUnitIndex,
  activeTabIndex,
  onUnitSelect,
  onTabChange,
}: UnitTabsProps) {
  const selectedUnit = units[selectedUnitIndex] || null;
  const sampleHistory = selectedUnit && Array.isArray(selectedUnit.sample_history)
    ? selectedUnit.sample_history
    : [];

  const activeUnitTabString = String(selectedUnitIndex);
  const activeSampleTabString = String(activeTabIndex);

  const handleUnitTabChange = (value: string) => {
    const unitIndex = Number(value);
    onUnitSelect(unitIndex);
  };

  const handleSampleTabChange = (value: string) => {
    onTabChange(Number(value));
  };

  if (units.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Top-level Unit Tabs */}
      <div className="border-b">
        <Tabs
          value={activeUnitTabString}
          onValueChange={handleUnitTabChange}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {units.map((unit, index) => {
              const unitCode = String(unit.unit_code || unit.code || "");
              const unitName = String(unit.unit_name || "");
              const displayLabel = unitCode || unitName || `Unit ${index + 1}`;
              
              return (
                <TabsTrigger
                  key={`unit-${index}-${unitCode || index}`}
                  value={String(index)}
                  className="whitespace-nowrap"
                >
                  {displayLabel}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Nested Sample History Tabs (only shown when unit is selected) */}
      {selectedUnit && (
        <div className="border-b px-6 pb-4">
          {sampleHistory.length > 0 ? (
            <Tabs
              value={activeSampleTabString}
              onValueChange={handleSampleTabChange}
              className="w-full"
            >
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
            <div className="text-sm text-muted-foreground py-2">
              No sample history available for this unit
            </div>
          )}
        </div>
      )}
    </div>
  );
}
