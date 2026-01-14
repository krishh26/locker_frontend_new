"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusItems = [
  { label: "Attended", status: "Attended", color: "bg-blue-500" },
  { label: "Cancelled", status: "Cancelled", color: "bg-red-500" },
  { label: "Late", status: "Learner Late", color: "bg-orange-500" },
  { label: "Not Attended", status: "Learner not Attended", color: "bg-gray-500" },
  { label: "Not Set", status: "Not Set", color: "bg-slate-400" },
];

export function CalendarStatusLegend() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Status Legend</h3>
      <div className="flex flex-wrap gap-2">
        {statusItems.map((item) => (
          <Badge
            key={item.label}
            variant="secondary"
            className={`${item.color} text-white hover:${item.color}`}
          >
            {item.label}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

