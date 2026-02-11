"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusItems = [
  { label: "Attended", status: "Attended", color: "bg-blue-500", bgCard: "from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-blue-900/20" },
  { label: "Cancelled", status: "Cancelled", color: "bg-red-500", bgCard: "from-red-100 to-red-50 dark:from-red-950/40 dark:to-red-900/20" },
  { label: "Late", status: "Learner Late", color: "bg-orange-500", bgCard: "from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/20" },
  { label: "Not Attended", status: "Learner not Attended", color: "bg-gray-500", bgCard: "from-gray-100 to-gray-50 dark:from-gray-950/40 dark:to-gray-900/20" },
  { label: "Not Set", status: "Not Set", color: "bg-slate-400", bgCard: "from-slate-100 to-slate-50 dark:from-slate-950/40 dark:to-slate-900/20" },
];

export function CalendarStatusLegend() {
  return (
    <Card className="p-4 bg-linear-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20 border-violet-200/40 dark:border-violet-800/20">
      <h3 className="text-lg font-semibold mb-3">Status Legend</h3>
      <div className="flex flex-wrap gap-2">
        {statusItems.map((item) => (
          <Badge
            key={item.label}
            variant="secondary"
            className={`${item.color} text-white hover:${item.color} shadow-sm`}
          >
            {item.label}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

