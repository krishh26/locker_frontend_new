"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusItems = [
  { label: "Attended", status: "Attended", color: "bg-primary" },
  { label: "Cancelled", status: "Cancelled", color: "bg-destructive" },
  { label: "Late", status: "Learner Late", color: "bg-accent" },
  { label: "Not Attended", status: "Learner not Attended", color: "bg-muted-foreground" },
  { label: "Not Set", status: "Not Set", color: "bg-muted-foreground/50" },
];

export function CalendarStatusLegend() {
  return (
    <Card className="p-4 bg-primary border-primary">
      <h3 className="text-lg font-semibold mb-3 text-white">Status Legend</h3>
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

