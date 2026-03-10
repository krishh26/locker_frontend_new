"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export function CalendarStatusLegend() {
  const t = useTranslations("calendar");

  const statusItems = [
    { label: t("status.attended"), status: "Attended", color: "bg-primary" },
    { label: t("status.cancelled"), status: "Cancelled", color: "bg-destructive" },
    { label: t("status.lateGeneric"), status: "Learner Late", color: "bg-accent" },
    {
      label: t("status.notAttendedGeneric"),
      status: "Learner not Attended",
      color: "bg-muted-foreground",
    },
    { label: t("status.notSet"), status: "Not Set", color: "bg-muted-foreground/50" },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3 text-foreground">
        {t("legend.title")}
      </h3>
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

